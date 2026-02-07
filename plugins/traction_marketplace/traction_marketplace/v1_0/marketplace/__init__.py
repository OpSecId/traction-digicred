"""Marketplace module: OOB invitation, transcript analysis, action menu, DB."""

import logging

from acapy_agent.config.injection_context import InjectionContext

from .config import get_config
from . import db
from .routes import register

LOGGER = logging.getLogger(__name__)


async def setup(context: InjectionContext):
    """Setup marketplace module."""
    LOGGER.info("> marketplace module setup...")
    get_config(context.settings)  # Validate config loads
    conn = await db.get_db()
    try:
        await db.init_schema(conn)
        LOGGER.info("Marketplace DB schema initialized")
    finally:
        await conn.close()
    LOGGER.info("< marketplace module setup.")
