#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Deploying latest changes in $APP_DIR..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull --ff-only || echo "Warning: skipped git pull (local uncommitted changes or no upstream)."
fi

npm install --legacy-peer-deps

TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM_MB" -lt 3000 ]; then
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
fi

npm run build
chmod -R a+rX "$APP_DIR/public"

pm2 startOrRestart "$APP_DIR/ecosystem.config.js" --env production
pm2 save
sudo systemctl reload caddy || true

echo "==> Deployment complete! Checking API health:"
curl -fsS http://127.0.0.1:3001/api/health
echo ""
