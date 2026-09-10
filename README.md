# Domain Platform

Monorepo containing both the frontend and backend for the Domain Reseller Platform.

## Structure

```
domain-platform/
├── frontend/    # React/Vite SPA (swaFrontend)
├── backend/     # Express/Node.js API
└── .github/     # Unified CI/CD workflow
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

Push to `main` to trigger automatic deployment via GitHub Actions. Both frontend and backend deploy independently in parallel.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Deploy key for the server |
| `SSH_HOST` | Server IP/hostname |
| `SSH_USER` | SSH username |

## Server Paths

| Component | Remote Path |
|-----------|-------------|
| Frontend | `/home/starswe1/domains/hozmashop.co.za/public_html/` |
| Backend | `/home/starswe1/node-apps/domain-reseller-backend/` |
