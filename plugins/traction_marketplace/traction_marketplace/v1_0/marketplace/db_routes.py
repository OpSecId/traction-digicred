"""Marketplace plugin DB API routes - tenants, requests, workflows, jobs, profiles."""

import functools
import json
import logging
from typing import Any

from aiohttp import web

from . import db

LOGGER = logging.getLogger(__name__)


def error_handler(func):
    @functools.wraps(func)
    async def wrapper(request):
        try:
            return await func(request)
        except Exception as err:
            LOGGER.exception(err)
            raise web.HTTPInternalServerError(reason=str(err)) from err

    return wrapper


async def _with_db(handler):
    """Run handler with a DB connection."""
    conn = await db.get_db()
    try:
        return await handler(conn)
    finally:
        await conn.close()


# --- Tenant requests ---


@error_handler
async def create_tenant_request(request: web.Request):
    body = await request.json()
    if not all(body.get(k) for k in ("tenantType", "name", "email")):
        raise web.HTTPBadRequest(reason="tenantType, name, and email are required")

    async def _do(conn):
        return await db.create_tenant_request(conn, body)

    result = await _with_db(_do)
    return web.json_response(result, status=201)


@error_handler
async def list_tenant_requests(request: web.Request):
    async def _do(conn):
        return await db.list_tenant_requests(conn)

    result = await _with_db(_do)
    return web.json_response({"requests": result})


@error_handler
async def get_tenant_request(request: web.Request):
    req_id = request.match_info["id"]

    async def _do(conn):
        return await db.get_tenant_request(conn, req_id)

    result = await _with_db(_do)
    if not result:
        raise web.HTTPNotFound(reason="Tenant request not found")
    return web.json_response(result)


@error_handler
async def update_tenant_request(request: web.Request):
    req_id = request.match_info["id"]
    body = await request.json()
    status = body.get("status")
    if status not in ("approved", "rejected"):
        raise web.HTTPBadRequest(reason='status must be "approved" or "rejected"')

    async def _do(conn):
        return await db.update_tenant_request_status(
            conn, req_id, status, body.get("rejectionReason")
        )

    result = await _with_db(_do)
    if not result:
        raise web.HTTPNotFound(reason="Tenant request not found")
    return web.json_response(result)


@error_handler
async def seed_tenant_requests(request: web.Request):
    body = await request.json()
    items = body.get("requests", body) if isinstance(body, dict) else []
    if not isinstance(items, list):
        items = [items] if items else []

    async def _do(conn):
        await db.seed_tenant_requests(conn, items)

    await _with_db(_do)
    return web.json_response({"seeded": len(items)})


# --- Tenants ---


@error_handler
async def list_tenants(request: web.Request):
    async def _do(conn):
        return await db.list_tenants(conn)

    result = await _with_db(_do)
    return web.json_response({"tenants": result})


@error_handler
async def get_tenant(request: web.Request):
    tenant_id = request.match_info["id"]

    async def _do(conn):
        return await db.get_tenant(conn, tenant_id)

    result = await _with_db(_do)
    if not result:
        raise web.HTTPNotFound(reason="Tenant not found")
    return web.json_response(result)


@error_handler
async def create_tenant(request: web.Request):
    body = await request.json()
    tenant_request_id = body.get("tenantRequestId")
    if not tenant_request_id:
        raise web.HTTPBadRequest(reason="tenantRequestId is required")

    async def _do(conn):
        return await db.create_tenant(
            conn,
            tenant_request_id,
            did=body.get("did"),
            wallet_id=body.get("walletId"),
            credential=body.get("credential"),
        )

    result = await _with_db(_do)
    return web.json_response(result, status=201)


@error_handler
async def create_tenant_manual(request: web.Request):
    body = await request.json()

    async def _do(conn):
        return await db.create_tenant_manual(
            conn,
            tenant_request_id=body.get("tenantRequestId"),
            did=body.get("did"),
            wallet_id=body.get("walletId"),
        )

    result = await _with_db(_do)
    return web.json_response(result, status=201)


@error_handler
async def revoke_tenant(request: web.Request):
    tenant_id = request.match_info["id"]

    async def _do(conn):
        return await db.revoke_tenant(conn, tenant_id)

    ok = await _with_db(_do)
    if not ok:
        raise web.HTTPNotFound(reason="Tenant not found")
    return web.json_response({"revoked": True})


# --- Workflows ---


@error_handler
async def list_workflows(request: web.Request):
    async def _do(conn):
        return await db.list_workflows(conn)

    result = await _with_db(_do)
    return web.json_response({"workflows": result})


@error_handler
async def list_workflows_by_employer(request: web.Request):
    employer_id = request.query.get("employerId")
    if not employer_id:
        raise web.HTTPBadRequest(reason="employerId query parameter is required")

    async def _do(conn):
        return await db.list_workflows_by_employer(conn, employer_id)

    result = await _with_db(_do)
    return web.json_response({"workflows": result})


@error_handler
async def create_workflow(request: web.Request):
    body = await request.json()
    tenant_request_id = body.get("tenantRequestId")
    workflow_type = body.get("workflowType")
    if not tenant_request_id or not workflow_type:
        raise web.HTTPBadRequest(reason="tenantRequestId and workflowType are required")

    async def _do(conn):
        return await db.create_workflow(conn, tenant_request_id, workflow_type)

    result = await _with_db(_do)
    return web.json_response(result, status=201)


# --- Employer profiles ---


@error_handler
async def get_employer_profile(request: web.Request):
    employer_id = request.query.get("employerId")
    if not employer_id:
        raise web.HTTPBadRequest(reason="employerId query parameter is required")

    async def _do(conn):
        return await db.get_employer_profile(conn, employer_id)

    result = await _with_db(_do)
    if not result:
        raise web.HTTPNotFound(reason="Employer profile not found")
    return web.json_response(result)


@error_handler
async def create_employer_profile(request: web.Request):
    body = await request.json()
    employer_id = body.get("employerId")
    credential = body.get("credential")
    if not employer_id or not credential:
        raise web.HTTPBadRequest(reason="employerId and credential are required")

    async def _do(conn):
        await db.create_employer_profile(conn, employer_id, credential)
        return {"employerId": employer_id, "credential": credential}

    result = await _with_db(_do)
    return web.json_response(result, status=201)


@error_handler
async def ensure_employer_profile(request: web.Request):
    body = await request.json()
    employer_id = body.get("employerId")
    credential = body.get("credential")
    if not employer_id or not credential:
        raise web.HTTPBadRequest(reason="employerId and credential are required")

    async def _do(conn):
        cred = await db.ensure_employer_profile(conn, employer_id, credential)
        return {"employerId": employer_id, "credential": cred}

    result = await _with_db(_do)
    return web.json_response(result)


# --- Job postings ---


@error_handler
async def list_job_postings(request: web.Request):
    employer_id = request.query.get("employerId")
    if not employer_id:
        raise web.HTTPBadRequest(reason="employerId query parameter is required")

    async def _do(conn):
        return await db.list_job_postings(conn, employer_id)

    result = await _with_db(_do)
    return web.json_response({"jobs": result})


@error_handler
async def get_job_posting(request: web.Request):
    job_id = request.match_info["id"]

    async def _do(conn):
        return await db.get_job_posting(conn, job_id)

    result = await _with_db(_do)
    if not result:
        raise web.HTTPNotFound(reason="Job posting not found")
    return web.json_response(result)


@error_handler
async def create_job_posting(request: web.Request):
    body = await request.json()
    if not all(body.get(k) for k in ("employerId", "employerName", "title", "description")):
        raise web.HTTPBadRequest(
            reason="employerId, employerName, title, and description are required"
        )

    async def _do(conn):
        return await db.create_job_posting(conn, body)

    result = await _with_db(_do)
    return web.json_response(result, status=201)


# --- Credential analysis config ---


@error_handler
async def get_credential_analysis(request: web.Request):
    async def _do(conn):
        return await db.get_credential_analysis_config(conn)

    result = await _with_db(_do)
    return web.json_response(result)


@error_handler
async def update_credential_analysis(request: web.Request):
    body = await request.json()

    async def _do(conn):
        return await db.update_credential_analysis_config(
            conn, body, body.get("updatedBy")
        )

    result = await _with_db(_do)
    return web.json_response(result)


def register_db_routes(app: web.Application) -> None:
    """Register marketplace DB API routes. Specific paths before {id} routes."""
    app.add_routes(
        [
            web.post("/marketplace/tenant-requests", create_tenant_request),
            web.get("/marketplace/tenant-requests", list_tenant_requests),
            web.post("/marketplace/tenant-requests/seed", seed_tenant_requests),
            web.get("/marketplace/tenant-requests/{id}", get_tenant_request),
            web.patch("/marketplace/tenant-requests/{id}", update_tenant_request),
            web.get("/marketplace/tenants", list_tenants),
            web.post("/marketplace/tenants", create_tenant),
            web.post("/marketplace/tenants/manual", create_tenant_manual),
            web.post("/marketplace/tenants/{id}/revoke", revoke_tenant),
            web.get("/marketplace/tenants/{id}", get_tenant),
            web.get("/marketplace/workflows/employer", list_workflows_by_employer),
            web.get("/marketplace/workflows", list_workflows),
            web.post("/marketplace/workflows", create_workflow),
            web.get("/marketplace/employer/profile", get_employer_profile),
            web.post("/marketplace/employer/profile", create_employer_profile),
            web.post("/marketplace/employer/profile/ensure", ensure_employer_profile),
            web.get("/marketplace/jobs", list_job_postings),
            web.get("/marketplace/jobs/{id}", get_job_posting),
            web.post("/marketplace/jobs", create_job_posting),
            web.get("/marketplace/credential-analysis", get_credential_analysis),
            web.put("/marketplace/credential-analysis", update_credential_analysis),
        ]
    )
    LOGGER.info("Registered marketplace DB routes")
