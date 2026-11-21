#!/usr/bin/env bash
# One-time bootstrap for a new host: creates .env and cloudflared/credentials.json
# from Infisical, then starts the stack.
set -euo pipefail
cd "$(dirname "$0")/.."

INFISICAL_API="https://app.infisical.com"

read -rp "Infisical Client ID: " INFISICAL_CLIENT_ID
read -rsp "Infisical Client Secret: " INFISICAL_CLIENT_SECRET; echo
read -rp "Infisical Project ID [6e5c09cd-6a2d-4338-896f-cca4907e3e2f]: " PID
INFISICAL_PROJECT_ID="${PID:-6e5c09cd-6a2d-4338-896f-cca4907e3e2f}"
read -rp "Infisical environment [dev]: " ENV_SLUG
INFISICAL_ENV="${ENV_SLUG:-dev}"

TOKEN=$(curl -sf -X POST "$INFISICAL_API/api/v1/auth/universal-auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$INFISICAL_CLIENT_ID\",\"clientSecret\":\"$INFISICAL_CLIENT_SECRET\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')

fetch_secret() {
  curl -sf "$INFISICAL_API/api/v3/secrets/raw/$1?workspaceId=$INFISICAL_PROJECT_ID&environment=$INFISICAL_ENV&secretPath=/" \
    -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["secret"]["secretValue"])'
}

mkdir -p cloudflared
fetch_secret TUNNEL_CREDENTIALS_JSON > cloudflared/credentials.json
chmod 600 cloudflared/credentials.json

cat > .env <<EOF
INFISICAL_CLIENT_ID=$INFISICAL_CLIENT_ID
INFISICAL_CLIENT_SECRET=$INFISICAL_CLIENT_SECRET
INFISICAL_PROJECT_ID=$INFISICAL_PROJECT_ID
INFISICAL_ENV=$INFISICAL_ENV
EOF
chmod 600 .env

docker compose up -d --build
echo "Done. App should be reachable via the configured tunnel hostname."
