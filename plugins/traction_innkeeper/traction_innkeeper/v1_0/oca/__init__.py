import logging

from acapy_agent.config.injection_context import InjectionContext
from acapy_agent.core.event_bus import EventBus, Event
from acapy_agent.core.plugin_registry import PluginRegistry
from acapy_agent.core.profile import Profile
from acapy_agent.core.protocol_registry import ProtocolRegistry
from acapy_agent.core.util import STARTUP_EVENT_PATTERN

from .oca_service import OcaService

LOGGER = logging.getLogger(__name__)


async def setup(context: InjectionContext):
    LOGGER.info("> plugin setup...")

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

    LOGGER.info("< plugin setup.")


async def on_startup(profile: Profile, event: Event):
    LOGGER.info("> on_startup")
    svc = OcaService(profile)
    profile.context.injector.bind_instance(OcaService, svc)

    OCA_PATH = "/oca"

    # Register /oca as a base wallet route (accessible with API key in multitenant mode)
    base_wallet_routes = profile.context.settings.get("multitenant.base_wallet_routes")
    if base_wallet_routes is None:
        base_wallet_routes = []
    elif isinstance(base_wallet_routes, str):
        base_wallet_routes = [base_wallet_routes]
    if OCA_PATH not in base_wallet_routes:
        base_wallet_routes.append(OCA_PATH)
    profile.context.settings.set_value(
        "multitenant.base_wallet_routes", base_wallet_routes
    )
    LOGGER.info(f"base_wallet_routes = {base_wallet_routes}")
    LOGGER.info("< on_startup")
