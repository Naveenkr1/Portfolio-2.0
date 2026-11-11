#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "==> Deploying latest changes in $APP_DIR..."
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull --ff-only || echo "Warning: skipped git pull (local uncommitted changes or no upstream)."
fi

npm install --legacy-peer-deps
npm run build
chmod -R a+rX "$APP_DIR/public"

pm2 startOrRestart "$APP_DIR/ecosystem.config.js" --env production
pm2 save
sudo systemctl reload caddy || true

echo "==> Deployment complete! Checking API health:"
curl -fsS http://127.0.0.1:3001/api/health
echo ""
