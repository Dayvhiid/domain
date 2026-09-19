# 3StarsWebHosting

Monorepo containing both the frontend and backend for the 3StarsWebHosting domain reseller platform.

## Structure

```
3starswebhosting/
├── frontend/          # Static HTML/Tailwind CSS (3starswebhosting.co.za)
├── backend/           # Express/Node.js API
├── deploy-webhook/    # Pull-based deployment receiver
│   ├── server.js      # Express webhook listener
│   └── scripts/
│       └── deploy-all.sh
└── README.md
```

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Deployment

This project uses **pull-based deployment**. GitHub pushes a webhook notification to the server, and the server pulls the latest code and deploys.

### How it works

1. Push to `main` triggers a GitHub webhook POST to `deploy.3starswebhosting.co.za/webhook`
2. The webhook receiver verifies the HMAC-SHA256 signature
3. Runs `deploy-all.sh` which:
   - Pulls latest code from `main`
   - Builds frontend (`npm ci && npm run build`)
   - Rsyncs `frontend/dist/` to `3starswebhosting.co.za/public_html/`
   - Installs backend production deps
   - Restarts Passenger via `touch tmp/restart.txt`

### Server setup (one-time)

1. **Generate deploy key** (outbound SSH to GitHub):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
   ```

2. **Add deploy key** to both GitHub repos (Settings → Deploy keys, read-only)

3. **Clone repos** on server:
   ```bash
   # Monorepo (contains both frontend and backend)
   cd ~/domains
    git clone git@github.com:Dayvhiid/3starswebhosting.git domain
   ```

4. **Create deploy-webhook app** in DirectAdmin (Setup Node.js App):
   - App root: `domains/deploy.3starswebhosting.co.za`
   - Startup file: `app.js`
   - Node.js version: 20

5. **Generate webhook secrets** and add to `.env`:
   ```bash
   openssl rand -hex 32
   ```
   Create `.env` in the deploy-webhook app directory:
   ```
   WEBHOOK_SECRET=<generated value>
   PORT=3000
   ```

6. **Configure GitHub webhooks** on the repo:
   - Payload URL: `https://deploy.3starswebhosting.co.za/webhook`
   - Content type: `application/json`
   - Secret: `<same value from .env>`
   - Events: "Just the push event"

### Required server directories

```
/home/starswe1/domains/api.3starswebhosting.co.za/     # monorepo clone
/home/starswe1/domains/3starswebhosting.co.za/public_html/  # frontend deploy target
```
