"""Traction Marketplace plugin v1.0."""

import logging

from aiohttp import web

from acapy_agent.config.injection_context import InjectionContext
from acapy_agent.core.event_bus import EventBus
from acapy_agent.core.plugin_registry import PluginRegistry
from acapy_agent.core.protocol_registry import ProtocolRegistry
from acapy_agent.core.util import STARTUP_EVENT_PATTERN

from . import marketplace
from .routes import register as register_routes

LOGGER = logging.getLogger(__name__)


async def on_startup(profile, event):
    """Register /marketplace routes as base wallet routes (API key access in multitenant)."""
    base_wallet_routes = profile.context.settings.get("multitenant.base_wallet_routes")
    if base_wallet_routes is None:
        base_wallet_routes = []
    elif isinstance(base_wallet_routes, str):
        base_wallet_routes = [base_wallet_routes]
    marketplace_paths = [
        "/marketplace/invitation",
        "/marketplace/analyze-transcript",
        "/marketplace/tenant-requests",
        "/marketplace/tenants",
        "/marketplace/workflows",
        "/marketplace/jobs",
        "/marketplace/employer/profile",
        "/marketplace/credential-analysis",
    ]
    for path in marketplace_paths:
        if path not in base_wallet_routes:
            base_wallet_routes.append(path)
    profile.context.settings.set_value("multitenant.base_wallet_routes", base_wallet_routes)
    LOGGER.info("marketplace base_wallet_routes: %s", base_wallet_routes)


async def setup(context: InjectionContext):
    """Setup the marketplace plugin."""
    LOGGER.info("> traction_marketplace plugin setup...")

    protocol_registry = context.inject(ProtocolRegistry)
    if not protocol_registry:
        raise ValueError("ProtocolRegistry missing in context")

    plugin_registry = context.inject(PluginRegistry)
    if not plugin_registry:
        raise ValueError("PluginRegistry missing in context")

    bus = context.inject(EventBus)
    if not bus:
        raise ValueError("EventBus missing in context")

    bus.subscribe(STARTUP_EVENT_PATTERN, on_startup)
    await marketplace.setup(context)

    LOGGER.info("< traction_marketplace plugin setup.")


async def register(app: web.Application):
    """Register marketplace plugin routes."""
    await register_routes(app)
