# Deployment Guide

## Prerequisites

- Node.js 20+
- MongoDB 6+
- OpenProvider reseller account
- Payment provider accounts (Paystack, Flutterwave, Payfast)

## Environment Setup

### 1. Clone and Configure
```bash
cd domain-reseller-backend
cp .env.example .env
# Edit .env with your values
```

### 2. Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | 32+ char random string | Yes |
| `OPENPROVIDER_USERNAME` | OpenProvider reseller username | Yes |
| `OPENPROVIDER_PASSWORD` | OpenProvider reseller password | Yes |
| `OPENPROVIDER_API_URL` | `https://api.openprovider.eu/v1beta` | Yes |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |

### 3. Generate Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Development

```bash
# Install dependencies
npm install

# Start development server (with file watching)
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Build (if using TypeScript, not needed for ES modules)
# npm run build

# Start with PM2
pm2 start src/server.js --name domain-reseller-api

# Save PM2 config
pm2 save
pm2 startup
```

**PM2 Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'domain-reseller-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      SESSION_COOKIE_SECURE: 'true',
    },
    error_file: '/var/log/domain-reseller/error.log',
    out_file: '/var/log/domain-reseller/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
  }],
};
```

### Option 2: Docker

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/
COPY .env ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

USER nodejs

EXPOSE 3000

CMD ["node", "src/server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/domain-reseller
      - SESSION_COOKIE_SECURE=true
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

### Option 3: Systemd Service

**/etc/systemd/system/domain-reseller-api.service:**
```ini
[Unit]
Description=Domain Reseller API
After=network.target mongod.service

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/domain-reseller-backend
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=domain-reseller-api

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable domain-reseller-api
sudo systemctl start domain-reseller-api
```

## Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

## SSL Certificates (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## MongoDB Production Setup

### Replica Set (Recommended)
```javascript
// mongod.conf
replication:
  replSetName: "rs0"
```

```bash
# Initialize replica set
mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'
```

### Connection String for Replica Set
```
MONGODB_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/domain-reseller?replicaSet=rs0
```

### Indexes
Run once after deployment:
```bash
mongosh domain-reseller --eval '
db.users.createIndex({email: 1}, {unique: true})
db.domains.createIndex({userId: 1, status: 1})
db.domains.createIndex({userId: 1, expirationDate: 1})
db.domains.createIndex({fullDomainName: 1})
db.domains.createIndex({openProviderDomainId: 1}, {unique: true})
db.contacts.createIndex({userId: 1, type: 1})
db.carts.createIndex({updatedAt: 1}, {expireAfterSeconds: 2592000})
db.orders.createIndex({userId: 1, status: 1})
'
```

## Monitoring

### Health Checks
```bash
# API health
curl https://api.yourdomain.com/health

# Database health
curl https://api.yourdomain.com/health/db
```

### Logs
```bash
# PM2 logs
pm2 logs domain-reseller-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/log/domain-reseller/out.log
```

### Metrics (Prometheus)
Add to `src/app.js`:
```javascript
import promClient from 'prom-client';
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Backup Strategy

### MongoDB Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/mongo_$DATE"
tar -czf "/backups/mongo_$DATE.tar.gz" "/backups/mongo_$DATE"
aws s3 cp "/backups/mongo_$DATE.tar.gz" s3://your-backup-bucket/
```

### Cron Job
```bash
# /etc/cron.d/mongodb-backup
0 2 * * * root /opt/scripts/backup-mongo.sh
```

## Scaling

### Horizontal Scaling
1. Run multiple API instances behind load balancer
2. Use MongoDB replica set
3. Shared session store (MongoDB)
4. Stateless API servers

### Load Balancer (HAProxy)
```
frontend https_front
    bind *:443 ssl crt /etc/ssl/certs/api.pem
    default_backend api_servers

backend api_servers
    balance roundrobin
    server api1 10.0.1.10:3000 check
    server api2 10.0.1.11:3000 check
    server api3 10.0.1.12:3000 check
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check `MONGODB_URI` format
- Verify network access (security groups, firewall)
- Check replica set status

**OpenProvider Auth Failed**
- Verify credentials in `.env`
- Check IP whitelist in OpenProvider panel
- Ensure `OPENPROVIDER_IP` matches server IP

**Session Not Persisting**
- Check `SESSION_COOKIE_SECURE=true` in production
- Verify `FRONTEND_URL` matches exactly
- Check `sameSite` policy

**Rate Limited**
- Check rate limit headers in response
- Adjust limits in `middleware/rateLimiter.js`

### Debug Mode
```bash
NODE_ENV=development LOG_LEVEL=debug npm run dev
```

## Security Checklist

- [ ] `NODE_ENV=production`
- [ ] `SESSION_COOKIE_SECURE=true`
- [ ] Strong `SESSION_SECRET` (32+ chars)
- [ ] HTTPS enforced via Nginx
- [ ] MongoDB authentication enabled
- [ ] MongoDB TLS enabled
- [ ] Rate limiting configured
- [ ] CORS restricted to frontend domain
- [ ] Helmet security headers enabled
- [ ] Regular dependency updates (`npm audit`)
- [ ] Environment variables not in version control
- [ ] Payment webhook secrets configured
- [ ] Error messages don't leak sensitive data