#!/usr/bin/env bash
set -euo pipefail

# Oracle Cloud (OCI) Always Free Ubuntu Setup Script
# Usage: ./scripts/oci-setup.sh [domain.com]

DOMAIN="${1:-:80}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Setting up Portfolio on Oracle Cloud Free Tier"
echo "    App Directory : $APP_DIR"
echo "    Site Address  : $DOMAIN"

# 1. Add 4GB swap automatically on low-RAM VMs (e.g. VM.Standard.E2.1.Micro 1GB)
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM_MB" -lt 3000 ] && [ ! -f /swapfile ]; then
  echo "==> Detected ${TOTAL_RAM_MB}MB RAM. Creating 4GB swapfile for Gatsby builds..."
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

# 2. Install base tools & build dependencies
echo "==> Installing system dependencies..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  git curl ca-certificates gnupg build-essential python3 \
  debian-keyring debian-archive-keyring apt-transport-https

# 3. Install Node.js 20 LTS if not installed (or < 18)
NODE_MAJOR=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
fi
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "==> Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "    Node version: $(node -v)"

# 4. Install PM2 globally
if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2..."
  sudo npm install -g pm2
fi

# 5. Install Caddy
if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Installing Caddy..."
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y caddy
fi

# 6. Open HTTP (80) & HTTPS (443) in Ubuntu iptables (OCI images block these by default)
echo "==> Opening ports 80 and 443 in OS firewall..."
REJECT_LINE=$(sudo iptables -L INPUT --line-numbers -n | awk '/REJECT/{print $1; exit}')
INSERT_POS="${REJECT_LINE:-1}"
if ! sudo iptables -S INPUT | grep -q -- '--dport 80 .*ACCEPT'; then
  sudo iptables -I INPUT "$INSERT_POS" -m state --state NEW -p tcp --dport 80 -j ACCEPT
fi
if ! sudo iptables -S INPUT | grep -q -- '--dport 443 .*ACCEPT'; then
  sudo iptables -I INPUT "$INSERT_POS" -m state --state NEW -p tcp --dport 443 -j ACCEPT
fi
echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
sudo netfilter-persistent save

# Allow Caddy service to traverse user home/app directory to reach public/ without exposing .env
chmod o+x "$HOME" "$APP_DIR"
if [ -f "$APP_DIR/.env" ]; then
  chmod 600 "$APP_DIR/.env"
fi

# 7. Install npm dependencies
cd "$APP_DIR"
echo "==> Installing npm dependencies..."
npm install --legacy-peer-deps

# 8. Configure Caddyfile
echo "==> Configuring /etc/caddy/Caddyfile..."
if [ "$DOMAIN" != ":80" ]; then
  BASE_DOMAIN="${DOMAIN#www.}"
  SITE_BLOCK="${BASE_DOMAIN}, www.${BASE_DOMAIN}"
else
  SITE_BLOCK=":80"
fi

sed "s|/home/ubuntu/portfolio/public|${APP_DIR}/public|g; s|^:80 {|${SITE_BLOCK} {|g" \
  "$APP_DIR/Caddyfile" | sudo tee /etc/caddy/Caddyfile >/dev/null

mkdir -p "$APP_DIR/public"
chmod a+rX "$APP_DIR/public"
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl enable caddy
sudo systemctl restart caddy

# 9. Build & Start PM2 if .env exists
if [ -f "$APP_DIR/.env" ]; then
  echo "==> Building Gatsby site..."
  if [ "$TOTAL_RAM_MB" -lt 3000 ]; then
    export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"
  fi
  npm run build
  chmod -R a+rX "$APP_DIR/public"
  echo "==> Starting API server with PM2..."
  pm2 startOrRestart "$APP_DIR/ecosystem.config.js" --env production
  pm2 save
  echo "==> Setup complete! Run the command printed by 'pm2 startup' if you haven't enabled boot autostart yet:"
  pm2 startup || true
else
  echo ""
  echo "==> Almost done! Create $APP_DIR/.env from .env.example:"
  echo "    cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
  echo "    Then run: ./scripts/oci-deploy.sh"
fi
