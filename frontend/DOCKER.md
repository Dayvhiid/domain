# swaFrontend - Docker

## Image

`swa-frontend` — Multi-stage build: Vite (Node 20) → nginx:alpine serving on port 80.

## Build

```bash
docker build -t swa-frontend ./swaFrontend
```

## Run

Requires the backend on the same Docker network. Nginx proxies `/api` to `http://swa-backend:5000`.

```bash
docker network create swa-net
docker run -d --name swa-backend --network swa-net -p 5000:5000 --env-file ./swaBackend/.env swa-backend
docker run -d --name swa-frontend --network swa-net -p 8080:80 swa-frontend
```

Open http://localhost:8080

## Nginx Config

The included `nginx.conf`:
- Serves the built SPA from `/usr/share/nginx/html`
- Falls back to `index.html` for client-side routing
- Proxies `/api` requests to `http://swa-backend:5000`

## Dev Mode (without Docker)

```bash
cd swaFrontend
npm ci
npm run dev
```

Dev server runs on port 3000 with Vite proxy to `http://localhost:5000`.
