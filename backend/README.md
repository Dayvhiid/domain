# Domain Reseller Backend

Backend API for the Domain Reseller Platform with OpenProvider integration.

## Features

- **Authentication**: Session-based auth with secure cookies
- **Domain Management**: Search, register, transfer, renew, WHOIS lookup
- **DNS Management**: Nameservers, NS groups, domain tokens
- **Shopping Cart**: Persistent cart with guest/user support
- **Order Processing**: Cart-to-order flow with payment provider integration
- **User Dashboard**: Stats, domains, orders, invoices
- **Contact Management**: WHOIS contacts (registrant, admin, tech, billing)
- **OpenProvider Integration**: Full API abstraction layer with token management
- **Multi-payment Support**: Paystack, Flutterwave, Payfast (config ready)

## Tech Stack

- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Session Store**: connect-mongo
- **API Client**: Axios with interceptors
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
src/
├── config/          # Configuration (DB, OpenProvider, Payments)
├── controllers/     # Request handlers
├── middleware/      # Express middleware (auth, validation, errors, rate limiting)
├── models/          # Mongoose models
├── routes/          # API route definitions
├── services/        # Business logic
├── utils/           # Helper functions
├── app.js           # Express app setup
└── server.js        # Entry point
```

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login user |
| POST | `/logout` | Logout user |
| GET | `/me` | Get current user |
| PUT | `/profile` | Update profile |
| PUT | `/password` | Change password |
| POST | `/refresh-openprovider` | Refresh OpenProvider token |

### Domains (`/api/v1/domains`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/check` | Check domain availability |
| GET | `/search` | Search with alternatives |
| GET | `/pricing` | Get domain pricing |
| POST | `/whois` | WHOIS lookup |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/` | List user domains |
| POST | `/register` | Register domain |
| POST | `/transfer` | Transfer domain |
| GET | `/:id` | Get domain details |
| PUT | `/:id` | Update domain |
| DELETE | `/:id` | Delete domain |
| POST | `/:id/renew` | Renew domain |
| GET | `/:id/auth-code` | Get EPP auth code |

### DNS (`/api/v1/dns`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/nameservers` | List nameservers |
| POST | `/nameservers` | Create nameserver |
| GET | `/nameserver-groups` | List NS groups |
| POST | `/nameserver-groups` | Create NS group |
| GET | `/nameserver-groups/:name` | Get NS group |
| PUT | `/nameserver-groups/:name` | Update NS group |
| DELETE | `/nameserver-groups/:name` | Delete NS group |
| POST | `/nameserver-groups/:name/default` | Set default NS group |
| POST | `/domain-token` | Create domain token |
| POST | `/sync` | Sync from OpenProvider |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get cart |
| POST | `/items` | Add item |
| DELETE | `/items/:domainName` | Remove item |
| PUT | `/items/:domainName/years` | Update years |
| PUT | `/items/:domainName/options` | Update options |
| DELETE | `/` | Clear cart |
| POST | `/coupon` | Apply coupon |
| DELETE | `/coupon` | Remove coupon |
| GET | `/checkout-summary` | Get checkout summary |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create order from cart |
| GET | `/` | List orders |
| GET | `/:id` | Get order |
| GET | `/number/:orderNumber` | Get by order number |
| POST | `/:id/pay` | Initiate payment |
| POST | `/:id/cancel` | Cancel order |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get profile |
| PUT | `/profile` | Update profile |
| PUT | `/password` | Change password |
| GET | `/dashboard` | Dashboard data |
| GET | `/domains` | User domains |
| GET | `/orders` | User orders |
| GET | `/invoices` | User invoices |

### Contacts (`/api/v1/contacts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List contacts |
| POST | `/` | Create contact |
| GET | `/:id` | Get contact |
| PUT | `/:id` | Update contact |
| DELETE | `/:id` | Delete contact |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/domain-reseller

# Session
SESSION_SECRET=your-32-char-secret
SESSION_COOKIE_NAME=dr_session

# OpenProvider
OPENPROVIDER_USERNAME=your-username
OPENPROVIDER_PASSWORD=your-password
OPENPROVIDER_API_URL=https://api.openprovider.eu/v1beta
OPENPROVIDER_IP=0.0.0.0

# Payments (v1 config only)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
```

## Installation

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production
npm start

# Run tests
npm test

# Lint
npm run lint
```

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": [...]
  }
}
```

### Paginated
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true,
      "page": 1,
      "totalPages": 5
    }
  }
}
```

## Development

### Database Indexes
Indexes are created automatically on first run. Key indexes:
- Users: email, openProviderResellerId, role
- Domains: userId+status, userId+expirationDate, fullDomainName, openProviderDomainId
- Contacts: userId+type, userId+email, openProviderContactId
- Orders: userId+status, userId+createdAt, paymentReference, orderNumber
- Cart: userId, sessionId, updatedAt (TTL)

### OpenProvider Token Management
- Tokens auto-refresh via axios interceptors
- Stored in user session and MongoDB
- 5-minute buffer before expiry

### Rate Limiting
- General API: 100 req/15min
- Auth endpoints: 10 req/15min
- Domain checks: 30 req/min
- Payments: 20 req/hour

## Deployment

1. Set `NODE_ENV=production`
2. Set `SESSION_COOKIE_SECURE=true`
3. Configure reverse proxy (nginx) with SSL
4. Set `FRONTEND_URL` to production domain
5. Use process manager (PM2) or Docker

## License

MIT"# 3starsWebHosting" 
