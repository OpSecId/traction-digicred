"""Marketplace plugin configuration."""

import logging
from typing import Any

LOGGER = logging.getLogger(__name__)

DEFAULT_CONTENT_URL = "https://marketplace.example.com/embed/channel"
DEFAULT_LABEL = "Apply Utopia"
DEFAULT_GOAL = "Browse jobs and opportunities"
GOAL_CODE = "connection.channel.marketplace"


def get_config(settings: Any) -> dict:
    """Get marketplace plugin config from settings."""
    plugin_config = settings.get("plugin_config") or {}
    config = plugin_config.get("traction_marketplace") or {}
    return {
        "content_url": config.get("content_url", DEFAULT_CONTENT_URL),
        "label": config.get("label", DEFAULT_LABEL),
        "goal": config.get("goal", DEFAULT_GOAL),
        "goal_code": config.get("goal_code", GOAL_CODE),
        "image_url": config.get("image_url"),
    }
