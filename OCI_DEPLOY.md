# Hosting on Oracle Cloud (OCI) Always Free Tier

This setup hosts **both** the static Gatsby portfolio (`public/`) and your live Express Admin CMS (`/admin`, `/login`, `/api/*`) on a single Oracle Cloud Always Free Ubuntu VM using **Caddy** (automatic HTTPS) and **PM2**.

## 1. Create an OCI Always Free VM
1. In the **Oracle Cloud Console**, go to **Compute → Instances → Create Instance**.
2. **Image:** Ubuntu 22.04 or 24.04.
3. **Shape (Always Free):**
   - **Recommended:** `VM.Standard.A1.Flex` (Ampere ARM — up to 4 OCPUs / 24 GB RAM free).
   - **Fallback (if A1 is out of capacity):** `VM.Standard.E2.1.Micro` (1 GB RAM — the setup script automatically creates a 4 GB swapfile for `gatsby build`).
4. **Networking:** Ensure **Assign a public IPv4 address** is selected and download your SSH private key.

## 2. Open Ports 80 & 443 in OCI VCN
1. Open your instance page → click the **Subnet** → click the **Security List**.
2. Click **Add Ingress Rules** and add:
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** `TCP`
   - **Destination Port Range:** `80,443`

*(Note: Ubuntu OS firewall rules inside the VM are automatically opened by `scripts/oci-setup.sh`.)*

## 3. Clone & Run Setup on the VM
SSH into your VM:
```bash
ssh -i /path/to/your-key.key ubuntu@<VM_PUBLIC_IP>
```

Clone the repo and run the setup script:
```bash
git clone https://github.com/Naveenkr1/Portfolio-2.0.git ~/portfolio
cd ~/portfolio
chmod +x scripts/oci-setup.sh scripts/oci-deploy.sh

# Test over raw IP first:
./scripts/oci-setup.sh

# OR, if DNS for your domain already points to <VM_PUBLIC_IP>:
# ./scripts/oci-setup.sh naveenkr.me
```

## 4. Add Environment Variables & Launch
Copy `.env.example` to `.env` and fill in your values (Supabase, Cloudinary, and `LOCAL_REBUILD=true`):
```bash
cp .env.example .env
nano .env
```

Then run the deploy script to build the site and start the API:
```bash
./scripts/oci-deploy.sh
```

Enable PM2 startup on reboot (run the command `pm2 startup` prints):
```bash
pm2 startup
```

## 5. Point Your Domain & Enable Free HTTPS
1. In your DNS provider, create `A` records for `@` and `www` pointing to your OCI VM's **Public IP**.
2. Once DNS resolves, re-run setup or update `/etc/caddy/Caddyfile` with your domain:
   ```bash
   ./scripts/oci-setup.sh naveenkr.me
   ```
   Caddy will automatically obtain and renew Let's Encrypt SSL certificates.

## 6. Updating Content via `/admin`
Visit `https://naveenkr.me/admin` (or `http://<VM_PUBLIC_IP>/admin`).
Because `LOCAL_REBUILD=true` is enabled in `ecosystem.config.js` / `.env`, clicking **Publish to Live** in the admin panel runs `npm run build` directly on the VM and updates the live site.

