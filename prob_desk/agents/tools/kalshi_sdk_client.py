"""
Official Kalshi Trade API client (sync SDK) for authenticated requests.

Uses ``kalshi-python-sync`` (``KalshiClient``, ``Configuration``). RSA signing is
handled by the SDK.

Environment
-----------
``KALSHI_TRADE_API_BASE``
    Trade API base URL (default: demo — see ``DEFAULT_KALSHI_BASE``).
``KALSHI_API_KEY_ID``
    API key id from Kalshi.
``KALSHI_PRIVATE_KEY_PATH``
    Path to PEM private key file, **or** set ``KALSHI_PRIVATE_KEY_PEM`` to the raw
    PEM string.

If key material is missing, :func:`get_kalshi_client` returns ``None`` and SDK tools
return a JSON error string.
"""

from __future__ import annotations

import os
from typing import Optional

from kalshi_python_sync import Configuration, KalshiClient

# Demo-first (matches `.env.example`).
DEFAULT_KALSHI_BASE = "https://demo-api.kalshi.co/trade-api/v2"


def _trade_api_base() -> str:
    return os.getenv("KALSHI_TRADE_API_BASE", DEFAULT_KALSHI_BASE).rstrip("/")


def _load_private_key_pem() -> Optional[str]:
    path = os.getenv("KALSHI_PRIVATE_KEY_PATH", "").strip()
    if path:
        with open(path, encoding="utf-8") as f:
            return f.read()
    inline = os.getenv("KALSHI_PRIVATE_KEY_PEM", "").strip()
    if inline:
        return inline.replace("\\n", "\n")
    return None


def build_kalshi_configuration() -> Configuration:
    """Build ``Configuration`` with host and optional Kalshi RSA credentials."""
    conf = Configuration(host=_trade_api_base())
    key_id = os.getenv("KALSHI_API_KEY_ID", "").strip()
    pem = _load_private_key_pem()
    if key_id and pem:
        conf.api_key_id = key_id
        conf.private_key_pem = pem
    return conf


def get_kalshi_client() -> Optional[KalshiClient]:
    """Return a signed ``KalshiClient``, or ``None`` if credentials are incomplete."""
    conf = build_kalshi_configuration()
    if not (
        getattr(conf, "api_key_id", None) and getattr(conf, "private_key_pem", None)
    ):
        return None
    return KalshiClient(configuration=conf)


__all__ = [
    "DEFAULT_KALSHI_BASE",
    "build_kalshi_configuration",
    "get_kalshi_client",
]
