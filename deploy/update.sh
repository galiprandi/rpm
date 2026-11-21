#!/usr/bin/env bash
# Pull latest main and redeploy if it changed. Intended for cron, e.g.:
#   */2 * * * * /home/user/rpm/deploy/update.sh >> /var/log/rpm-deploy.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch -q origin main
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  exit 0
fi

git pull --ff-only origin main
docker compose build app
docker compose up -d app
