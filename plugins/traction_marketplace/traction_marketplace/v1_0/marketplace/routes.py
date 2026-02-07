"""Marketplace plugin routes: invitation, transcript analysis, action menu."""

import base64
import functools
import json
import logging
from typing import Any, Optional

from aiohttp import web
from aiohttp_apispec import docs, request_schema, response_schema
from marshmallow import fields
from marshmallow.exceptions import ValidationError

from acapy_agent.admin.decorators.auth import tenant_authentication
from acapy_agent.admin.request_context import AdminRequestContext
from acapy_agent.messaging.models.openapi import OpenAPISchema
from acapy_agent.protocols.out_of_band.v1_0.manager import OutOfBandManager
from acapy_agent.protocols.out_of_band.v1_0.messages.invitation import HSProto

from .config import GOAL_CODE, get_config
from .db_routes import register_db_routes
from .transcript_analysis import analyze_transcript

LOGGER = logging.getLogger(__name__)

SWAGGER_CATEGORY = "traction-marketplace"


def error_handler(func):
    """Handle errors in route handlers."""

    @functools.wraps(func)
    async def wrapper(request):
        try:
            return await func(request)
        except ValidationError as err:
            raise web.HTTPUnprocessableEntity(reason=str(err.messages)) from err
        except Exception as err:
            LOGGER.exception(err)
            raise web.HTTPInternalServerError(reason=str(err)) from err

    return wrapper


class CreateMarketplaceInvitationRequestSchema(OpenAPISchema):
    """Request schema for creating marketplace invitation."""

    content_url = fields.Str(
        required=False,
        metadata={"description": "Marketplace PWA content URL", "example": "https://marketplace.example.com/embed/channel"},
    )
    goal = fields.Str(
        required=False,
        metadata={"description": "Human-readable goal", "example": "Browse jobs and opportunities from Apply Utopia"},
    )
    multi_use = fields.Bool(
        required=False,
        load_default=True,
        metadata={"description": "Create multi-use invitation"},
    )
    image_url = fields.Str(
        required=False,
        metadata={"description": "Image URL for OOB invitation (overrides config)"},
    )


class MarketplaceInvitationResponseSchema(OpenAPISchema):
    """Response schema for marketplace invitation."""

    invitation = fields.Dict(metadata={"description": "OOB invitation message"})
    invitation_url = fields.Str(metadata={"description": "Encoded invitation URL"})
    oob_id = fields.Str(metadata={"description": "OOB record identifier"})


class AnalyzeTranscriptRequestSchema(OpenAPISchema):
    """Request schema for transcript analysis."""

    credential_data = fields.Dict(
        required=True,
        metadata={"description": "Transcript credential data (credentialSubject, attributes, etc.)"},
    )


class AnalyzeTranscriptResponseSchema(OpenAPISchema):
    """Response schema for transcript analysis."""

    skills = fields.List(fields.Str(), metadata={"description": "Extracted skills"})
    courses = fields.List(fields.Dict(), metadata={"description": "Course list"})
    gpa = fields.Str(allow_none=True, metadata={"description": "GPA if present"})
    program = fields.Str(allow_none=True, metadata={"description": "Program/degree if present"})
    overview = fields.Str(allow_none=True, metadata={"description": "Human-readable overview"})


class SendActionMenuRequestSchema(OpenAPISchema):
    """Request schema for sending action menu."""

    menu = fields.Dict(
        required=True,
        metadata={"description": "Action menu items", "example": {"title": "Share transcript", "description": "Share your transcript for job matching"}},
    )


@docs(tags=[SWAGGER_CATEGORY], summary="Create marketplace channel OOB invitation")
@request_schema(CreateMarketplaceInvitationRequestSchema())
@response_schema(MarketplaceInvitationResponseSchema(), 200)
@error_handler
@tenant_authentication
async def create_marketplace_invitation(request: web.BaseRequest):
    """Create OOB invitation with goal_code and marketplace channel metadata attachment."""
    context: AdminRequestContext = request["context"]
    profile = context.profile
    body = await request.json() if request.body_exists else {}

    config = get_config(profile.settings)
    content_url = body.get("content_url") or config["content_url"]
    goal = body.get("goal") or config["goal"]
    multi_use = body.get("multi_use", True)
    image_url = body.get("image_url") or config.get("image_url")

    # Channel metadata attachment (application/marketplace-channel+json)
    channel_metadata = {
        "channelType": GOAL_CODE,
        "contentUrl": content_url,
        "version": "1.0",
    }
    metadata_json = json.dumps(channel_metadata)
    metadata_b64 = base64.b64encode(metadata_json.encode()).decode()

    attachment = {
        "id": "digicred-channel-metadata",
        "media_type": "application/marketplace-channel+json",
        "data": {"base64": metadata_b64},
    }

    # Create OOB invitation via OutOfBandManager
    # ACA-Py requires handshake_protocols or request attachments (or both)
    oob_mgr = OutOfBandManager(profile)
    invi_rec = await oob_mgr.create_invitation(
        my_label=config["label"],
        goal_code=GOAL_CODE,
        goal=goal,
        multi_use=multi_use,
        auto_accept=True,
        hs_protos=[HSProto.DIDEX_1_1],
    )

    # Get invitation as dict from record
    invitation = getattr(invi_rec, "invitation", None)
    if invitation is not None and hasattr(invitation, "serialize"):
        invitation = invitation.serialize()
    elif invitation is not None and hasattr(invitation, "__dict__"):
        invitation = dict(invitation)
    else:
        invitation = {}
    if isinstance(invitation, str):
        invitation = json.loads(invitation) if invitation else {}
    if not isinstance(invitation, dict):
        invitation = {}

    # Add attachments for marketplace channel metadata
    if "attachments" not in invitation:
        invitation["attachments"] = []
    invitation["attachments"].append(attachment)

    # Add image for OOB invitation display (QR, wallet UI)
    if image_url:
        invitation["imageUrl"] = image_url

    # Re-encode invitation_url with augmented invitation
    invitation_bytes = json.dumps(invitation, separators=(",", ":")).encode()
    invitation_b64 = base64.urlsafe_b64encode(invitation_bytes).rstrip(b"=").decode()
    invitation_url = f"https://example.com/connect?oob={invitation_b64}"

    oob_id = getattr(invi_rec, "invi_msg_id", None) or getattr(invi_rec, "invitation_id", None) or getattr(invi_rec, "oob_id", None) or ""

    return web.json_response(
        {
            "invitation": invitation,
            "invitation_url": invitation_url,
            "oob_id": oob_id,
        }
    )


@docs(tags=[SWAGGER_CATEGORY], summary="Analyze transcript credential")
@request_schema(AnalyzeTranscriptRequestSchema())
@response_schema(AnalyzeTranscriptResponseSchema(), 200)
@error_handler
@tenant_authentication
async def analyze_transcript_handler(request: web.BaseRequest):
    """Analyze transcript credential data; extract skills, courses, GPA, program."""
    body = await request.json()
    credential_data = body.get("credential_data") or body
    result = analyze_transcript(credential_data)
    return web.json_response(result)


@docs(tags=[SWAGGER_CATEGORY], summary="Send action menu to connection")
@request_schema(SendActionMenuRequestSchema())
@tenant_authentication
async def send_action_menu(request: web.BaseRequest):
    """Send action menu to a connection. Placeholder - ACA-Py action menu protocol integration."""
    # TODO: Integrate with ACA-Py action menu protocol
    # For now return 501 - Action menu protocol integration pending
    raise web.HTTPNotImplemented(
        reason="Action menu protocol integration pending. Use ACA-Py action menu endpoints when available."
    )


async def register(app: web.Application):
    """Register marketplace routes."""
    LOGGER.info("> registering marketplace routes")
    app.add_routes(
        [
            web.post("/marketplace/invitation", create_marketplace_invitation),
            web.post("/marketplace/analyze-transcript", analyze_transcript_handler),
            web.post("/marketplace/action-menu/{connection_id}", send_action_menu),
        ]
    )
    register_db_routes(app)
    LOGGER.info("< registering marketplace routes")
