# Deployment Guide — Pull-Based Webhook System

## Architecture

```
You push to main on GitHub
        │
        ▼
GitHub sends POST webhook to https://3starswebhosting.co.za/webhook.php
        │
        ▼
PHP proxy (webhook.php) forwards to Node.js on 127.0.0.1:3001
        │
        ▼
deploy-webhook app verifies HMAC signature, runs deploy-all.sh
        │
        ▼
deploy-all.sh: git pull → build frontend → cp to public_html → npm install backend → restart
```

**Why this setup?** Inbound SSH (port 22) is blocked by the server firewall. GitHub Actions can't push to the server. So we flipped it — the server pulls from GitHub when notified by a webhook. Outbound SSH works fine.

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | `102.209.117.206` |
| SSH user | `starswe1` |
| Web server | OpenLiteSpeed (ports 80/443) |
| Node.js | v20 (via DirectAdmin nodevenv) |
| GitHub repo | `https://github.com/Dayvhiid/domain.git` |

## Key Paths

| Path | Purpose |
|------|---------|
| `/home/starswe1/domains/domain/` | Monorepo clone (git) |
| `/home/starswe1/domains/domain/frontend/` | Frontend source |
| `/home/starswe1/domains/domain/backend/` | Backend source |
| `/home/starswe1/domains/domain/deploy-webhook/` | Webhook receiver app |
| `/home/starswe1/domains/domain/deploy-webhook/server.js` | Webhook entry point |
| `/home/starswe1/domains/domain/deploy-webhook/scripts/deploy-all.sh` | Deploy script |
| `/home/starswe1/domains/domain/deploy-webhook/deploy.log` | Deploy log |
| `/home/starswe1/domains/domain/deploy-webhook/.env` | Secrets (WEBHOOK_SECRET, PORT) |
| `/home/starswe1/domains/3starswebhosting.co.za/public_html/` | Frontend deploy target |
| `/home/starswe1/domains/3starswebhosting.co.za/public_html/webhook.php` | PHP proxy to Node.js |
| `/home/starswe1/.ssh/github_deploy` | SSH private key for GitHub |
| `/home/starswe1/.ssh/config` | SSH config (points to github_deploy key) |
| `/home/starswe1/nodevenv/domains/domain/deploy-webhook/20/` | Node.js venv for deploy-webhook |

## Secrets

| Secret | Where | Purpose |
|--------|-------|---------|
| `WEBHOOK_SECRET` | `deploy-webhook/.env` + GitHub webhook settings | Verifies webhooks are really from GitHub |
| `github_deploy` private key | `~/.ssh/github_deploy` | Server pulls code from GitHub |

---

## How a Deploy Works

1. You `git push origin main` from your local machine
2. GitHub sends a POST to `https://3starswebhosting.co.za/webhook.php`
3. `webhook.php` proxies the request to `http://127.0.0.1:3001/webhook`
4. `server.js` verifies the HMAC-SHA256 signature against `WEBHOOK_SECRET`
5. If valid, responds 200 immediately, then runs `deploy-all.sh` async
6. `deploy-all.sh` does:
   - `git fetch origin main && git reset --hard origin/main`
   - `cd frontend && npm ci && npm run build`
   - `rm -rf public_html/* && cp -r dist/* public_html/`
   - `cd backend && npm install --omit=dev --production`
   - `touch backend/tmp/restart.txt` (restarts Passenger)

---

## One-Time Server Setup (for new servers)

### 1. Generate SSH deploy key

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Add the public key as a **read-only deploy key** on the GitHub repo:
https://github.com/Dayvhiid/domain/settings/keys

### 2. Configure SSH to use the deploy key

```bash
cat > ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly true
EOF
chmod 600 ~/.ssh/config
```

Test:
```bash
ssh -T git@github.com
# Should say: Hi Dayvhiid/domain! You've successfully authenticated...
```

### 3. Clone the monorepo

```bash
cd ~/domains
git clone git@github.com:Dayvhiid/domain.git domain
```

### 4. Set up deploy-webhook app

```bash
cd ~/domains/domain/deploy-webhook
```

Activate the nodevenv (DirectAdmin):
```bash
source ~/nodevenv/domains/domain/deploy-webhook/20/bin/activate
```

Install dependencies:
```bash
npm install
```

### 5. Generate webhook secret and create .env

```bash
SECRET=$(openssl rand -hex 32)
cat > .env << EOF
WEBHOOK_SECRET=$SECRET
PORT=3001
EOF
echo "SAVE THIS SECRET: $SECRET"
```

**You must save the secret** — it goes into GitHub webhook settings too.

### 6. Install pm2 and start the app

```bash
npm install -g pm2
pm2 start server.js --name deploy-webhook
pm2 save
```

Set up auto-restart on reboot:
```bash
(crontab -l 2>/dev/null; echo "@reboot cd /home/starswe1/domains/domain/deploy-webhook && source ~/nodevenv/domains/domain/deploy-webhook/20/bin/activate && pm2 resurrect") | crontab -
```

### 7. Create PHP proxy

```bash
cat > ~/domains/3starswebhosting.co.za/public_html/webhook.php << 'SCRIPT'
<?php
$target = 'http://127.0.0.1:3001/webhook';
$method = $_SERVER['REQUEST_METHOD'];

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 300);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: ' . $_SERVER['CONTENT_TYPE'],
    'X-GitHub-Event: ' . ($_SERVER['HTTP_X_GITHUB_EVENT'] ?? ''),
    'X-Hub-Signature-256: ' . ($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? ''),
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
SCRIPT
```

### 8. Configure GitHub webhook

Go to https://github.com/Dayvhiid/domain/settings/hooks → Add webhook:
- **Payload URL:** `https://3starswebhosting.co.za/webhook.php`
- **Content type:** `application/json`
- **Secret:** (same value from step 5)
- **Events:** Just the push event

### 9. Test

```bash
# From your local machine
git commit --allow-empty -m "test deploy"
git push origin main

# On the server, watch the deploy
tail -f ~/domains/domain/deploy-webhook/deploy.log
```

---

## Troubleshooting

### Deploy not triggering

1. Check GitHub webhook delivery log: https://github.com/Dayvhiid/domain/settings/hooks → click the webhook → Recent Deliveries
2. If no deliveries at all: webhook might be misconfigured or inactive
3. If deliveries show 5xx: check PHP proxy and Node.js app

### PHP proxy returns errors

```bash
# Test if Node.js is running
curl -s http://127.0.0.1:3001/health

# If connection refused, restart PM2
source ~/nodevenv/domains/domain/deploy-webhook/20/bin/activate
pm2 list
pm2 restart deploy-webhook
```

### Deploy script fails

```bash
# Check the deploy log
cat ~/domains/domain/deploy-webhook/deploy.log | tail -30

# Common issues:
# - "Permission denied" on scripts: chmod +x scripts/*.sh
# - "npm: command not found": activate nodevenv first
# - "git pull failed": check SSH key is still valid
```

### SSH to GitHub fails

```bash
ssh -T git@github.com 2>&1

# If "Permission denied":
# 1. Check key exists: cat ~/.ssh/github_deploy.pub
# 2. Check SSH config: cat ~/.ssh/config
# 3. Check key is still on GitHub repo settings
```

### PM2 app keeps restarting (high ↺ count)

```bash
# Check the error
pm2 logs deploy-webhook --lines 50 --nostream

# Common issue: WEBHOOK_SECRET not set in .env
cat ~/domains/domain/deploy-webhook/.env
# Should contain: WEBHOOK_SECRET=<hex value> and PORT=3001

# If missing, regenerate:
SECRET=$(openssl rand -hex 32)
printf "WEBHOOK_SECRET=$SECRET\nPORT=3001\n" > ~/domains/domain/deploy-webhook/.env
pm2 restart deploy-webhook --update-env
```

### Frontend build fails

```bash
cd ~/domains/domain/frontend
# Activate nodevenv
source ~/nodevenv/domains/domain/deploy-webhook/20/bin/activate
npm ci
npm run build
# Check for errors
```

### Site shows old content after deploy

```bash
# Check if build output exists
ls ~/domains/domain/frontend/dist/

# Check if public_html was updated
ls ~/domains/3starswebhosting.co.za/public_html/index.html

# Manual deploy if needed
rm -rf ~/domains/3starswebhosting.co.za/public_html/*
cp -r ~/domains/domain/frontend/dist/* ~/domains/3starswebhosting.co.za/public_html/
```

---

## PM2 Commands Reference

```bash
# Always activate nodevenv first
source ~/nodevenv/domains/domain/deploy-webhook/20/bin/activate

pm2 list                    # List all running apps
pm2 status                  # Same as list
pm2 logs deploy-webhook     # Tail live logs
pm2 logs deploy-webhook --lines 50 --nostream  # Last 50 lines
pm2 restart deploy-webhook  # Restart the app
pm2 stop deploy-webhook     # Stop the app
pm2 delete deploy-webhook   # Remove from PM2
pm2 save                    # Save current process list (for restart on reboot)
pm2 show deploy-webhook     # Show app details
```

---

## How to Deploy (Normal Workflow)

After everything is set up, deploying is just:

```bash
git add .
git commit -m "your changes"
git push origin main
```

That's it. The webhook handles everything else automatically.

To watch a deploy in progress on the server:
```bash
tail -f ~/domains/domain/deploy-webhook/deploy.log
```
