# Kalshi private key (local only)

Put your Kalshi RSA private key in **`private_key.pem`** in this folder (full PEM from the dashboard download).

In `.env` at the project root:

```bash
KALSHI_API_KEY_ID=your-key-id-from-kalshi-dashboard
KALSHI_PRIVATE_KEY_PATH=secrets/kalshi/private_key.pem
KALSHI_TRADE_API_BASE=https://demo-api.kalshi.co/trade-api/v2
```

First time setup:

```bash
cp secrets/kalshi/private_key.pem.example secrets/kalshi/private_key.pem
# then paste your key into private_key.pem
```

`private_key.pem` is gitignored — never commit it.
