#!/usr/bin/env bash
# Registers the Telegram webhook against a public tunnel URL.
#
# Usage:
#   ./scripts/set-telegram-webhook.sh https://your-tunnel.trycloudflare.com
#
# Reads TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from Backend/api/.env.
# Re-run this whenever the tunnel URL changes (cloudflared quick tunnels rotate
# their hostname on every restart).
set -euo pipefail

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then
  echo "Usage: $0 <https-tunnel-base-url>" >&2
  exit 1
fi
BASE_URL="${BASE_URL%/}" # strip trailing slash

ENV_FILE="$(dirname "$0")/../Backend/api/.env"
get_env() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2-; }

TOKEN="$(get_env TELEGRAM_BOT_TOKEN)"
SECRET="$(get_env TELEGRAM_WEBHOOK_SECRET)"

if [[ -z "$TOKEN" || -z "$SECRET" ]]; then
  echo "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET in $ENV_FILE" >&2
  exit 1
fi

HOOK_URL="$BASE_URL/telegram/webhook/$SECRET"
echo "Setting webhook -> $HOOK_URL"
curl -s "https://api.telegram.org/bot$TOKEN/setWebhook?url=$HOOK_URL"
echo ""
echo "--- getWebhookInfo ---"
curl -s "https://api.telegram.org/bot$TOKEN/getWebhookInfo"
echo ""
