"""Tests for Kalshi live quote / WebSocket helpers."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import pytest

from prob_desk.agents.tools import kalshi_stream


def test_ws_url_maps_demo_host() -> None:
    with patch.dict(
        "os.environ",
        {"KALSHI_TRADE_API_BASE": "https://demo-api.kalshi.co/trade-api/v2"},
        clear=False,
    ):
        url = kalshi_stream.kalshi_ws_url()
    assert url == "wss://external-api-ws.demo.kalshi.co/trade-api/ws/v2"


def test_best_from_orderbook_payload() -> None:
    data = {
        "orderbook": {
            "yes": [[0.42, 100]],
            "no": [[0.55, 50]],
        }
    }
    quote = kalshi_stream._best_from_orderbook_payload(data)
    assert quote["yes_bid_dollars"] == 0.42
    assert quote["yes_ask_dollars"] == pytest.approx(0.45)


def test_live_quote_rest_fallback_without_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("KALSHI_API_KEY_ID", raising=False)
    monkeypatch.delenv("KALSHI_PRIVATE_KEY_PATH", raising=False)
    monkeypatch.delenv("KALSHI_PRIVATE_KEY_PEM", raising=False)
    monkeypatch.setattr(
        kalshi_stream,
        "kalshi_get_orderbook",
        lambda ticker: json.dumps(
            {"orderbook": {"yes": [[0.50, 10]], "no": [[0.48, 10]]}}
        ),
    )
    out = json.loads(kalshi_stream.kalshi_get_live_quote("TEST-MKT"))
    assert out["source"] == "rest_orderbook"
    assert out["market_ticker"] == "TEST-MKT"
    assert out["yes_bid_dollars"] == 0.50


@pytest.mark.asyncio
async def test_ws_snapshot_collects_ticker(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        kalshi_stream,
        "_ws_auth_headers",
        lambda: {
            "KALSHI-ACCESS-KEY": "k",
            "KALSHI-ACCESS-SIGNATURE": "s",
            "KALSHI-ACCESS-TIMESTAMP": "1",
        },
    )

    class _FakeWS:
        def __init__(self, *_a, **_k):
            self._sent = False

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_a):
            return False

        async def send(self, _msg):
            self._sent = True

        async def recv(self):
            if not self._sent:
                return json.dumps({"type": "subscribed"})
            return json.dumps(
                {
                    "type": "ticker",
                    "msg": {
                        "market_ticker": "FOO",
                        "yes_bid_dollars": "0.40",
                        "yes_ask_dollars": "0.42",
                    },
                }
            )

    with patch.object(kalshi_stream.websockets, "connect", _FakeWS):
        result = await kalshi_stream._ws_live_snapshot(
            "FOO",
            max_wait_seconds=2.0,
            max_updates=1,
        )
    assert result["updates_collected"] == 1
    assert result["yes_bid_dollars"] == "0.40"
