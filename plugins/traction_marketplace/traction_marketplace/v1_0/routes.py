"""Register marketplace plugin routes."""

import logging

from aiohttp import web

from .marketplace.routes import register as marketplace_register

LOGGER = logging.getLogger(__name__)


async def register(app: web.Application):
    """Register all marketplace plugin routes."""
    LOGGER.info("> register traction_marketplace routes")
    await marketplace_register(app)
    LOGGER.info("< register traction_marketplace routes")


def post_process_routes(app: web.Application):
    """Amend swagger API with marketplace tag."""
    if "tags" not in app._state["swagger_dict"]:
        app._state["swagger_dict"]["tags"] = []
    app._state["swagger_dict"]["tags"].append(
        {
            "name": "traction-marketplace",
            "description": "Marketplace OOB invitation, transcript analysis, action menu",
        }
    )
