# Architecture Documentation

## System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   Frontend      │────▶│  Backend API     │────▶│  OpenProvider API  │
│   (React/HTML)  │     │  (Node/Express)  │     │  (Registrar)       │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │    MongoDB       │
                       │  (Data Store)    │
                       └──────────────────┘
```

## Component Architecture

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Layer                             │
│  (Express Router → Controllers → Middleware)               │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
│  (Auth, Domain, DNS, Cart, Order, Payment Services)        │
├─────────────────────────────────────────────────────────────┤
│                   Data Access Layer                         │
│  (Mongoose Models → MongoDB)                               │
├─────────────────────────────────────────────────────────────┤
│                 External Integration Layer                  │
│  (OpenProvider Service → OpenProvider REST API)            │
└─────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Responsibility |
|---------|---------------|
| `AuthService` | User registration, login, session management, OpenProvider token sync |
| `DomainService` | Domain search, registration, transfer, renewal, WHOIS, dashboard stats |
| `DnsService` | Nameservers, NS groups, domain tokens, OpenProvider sync |
| `CartService` | Cart CRUD, guest/user merging, checkout summary |
| `OrderService` | Order creation, payment initiation, provisioning, cancellation |

## Data Flow

### Domain Search Flow
```
Frontend → POST /api/v1/domains/search
    │
    ▼
DomainController.searchDomain()
    │
    ▼
DomainService.searchDomain(query)
    │
    ├──▶ OpenProviderService.checkDomain() ──▶ OpenProvider API
    ├──▶ OpenProviderService.getPricing() ───▶ OpenProvider API
    └──▶ Local suggestions generation
    │
    ▼
Returns: { primary, alternatives, suggestions }
```

### Domain Registration Flow
```
Frontend → POST /api/v1/orders (from cart)
    │
    ▼
OrderService.createOrder()
    │
    ▼
CartService.cartToOrderItems()
    │
    ▼
Order created (status: pending)
    │
    ▼
Frontend → POST /api/v1/orders/:id/pay
    │
    ▼
OrderService.initiatePayment() → Payment Provider
    │
    ▼ (after payment webhook - v2)
OrderService.processOrderProvisioning()
    │
    ├──▶ OpenProviderService.registerDomain() ──▶ OpenProvider API
    ├──▶ Create local Domain records
    └──▶ Update Order status: completed
```

### Authentication Flow
```
POST /api/v1/auth/login
    │
    ▼
AuthService.login(email, password)
    │
    ├──▶ User.findByEmail() + comparePassword()
    ├──▶ OpenProviderService.initialize() (if needed)
    │
    ▼
req.session.userId = user._id
req.session.openProviderToken = token
req.session.openProviderResellerId = resellerId
    │
    ▼
Set-Cookie: dr_session=...
    │
    ▼
Return: { user, openProvider: { token, resellerId } }
```

## Security Architecture

### Authentication
- Session-based with secure, httpOnly cookies
- MongoDB-backed session store (connect-mongo)
- Password hashing: bcrypt with 12 rounds
- Account lockout after 5 failed attempts (2 hours)

### Authorization
- Role-based: `user`, `admin`, `reseller`
- Resource ownership validation middleware
- Admin bypass for all resources

### API Protection
- Helmet security headers
- CORS restricted to frontend origin
- Rate limiting per endpoint type
- Input validation with Zod schemas
- Sanitization middleware

### OpenProvider Security
- Credentials stored in environment variables only
- Tokens stored encrypted in session/MongoDB
- Automatic token refresh with 5-min buffer
- Request/response logging (dev only)

## Database Design

### Collections

| Collection | Key Indexes | TTL |
|------------|-------------|-----|
| `users` | email (unique), openProviderResellerId, role | - |
| `domains` | userId+status, userId+expirationDate, fullDomainName, openProviderDomainId (unique) | - |
| `contacts` | userId+type, userId+email, openProviderContactId (unique) | - |
| `nameservergroups` | userId+name (unique), openProviderNsGroupId (unique) | - |
| `carts` | userId, sessionId, updatedAt | 30 days |
| `orders` | userId+status, userId+createdAt, paymentReference, orderNumber (unique) | - |
| `invoices` | userId+status, userId+issueDate, openProviderInvoiceId (unique), invoiceNumber (unique) | - |
| `sessions` | _id, expires | MongoDB TTL |

### Data Relationships

```
User (1) ─────< (N) Domain
User (1) ─────< (N) Contact
User (1) ─────< (N) NameserverGroup
User (1) ─────< (1) Cart
User (1) ─────< (N) Order
Order (1) ───< (N) OrderItem
Order (1) ──── (1) Invoice
User (1) ─────< (N) Invoice
```

## Error Handling

### Error Types
1. **OpenProviderError** - From OpenProvider API (mapped HTTP codes)
2. **ValidationError** - Zod/Mongoose validation (400)
3. **AppError** - Custom operational errors (4xx/5xx)
4. **Internal Errors** - Unexpected (500)

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Human readable message",
    "code": "ERROR_CODE",
    "details": [...]
  }
}
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (session in MongoDB)
- Read replicas for MongoDB
- Redis for rate limiting (future)

### Caching Strategy
- OpenProvider token in memory
- Domain pricing cache (5 min)
- NS groups cache (10 min)

### Background Jobs (Future)
- Domain expiration monitoring
- Auto-renewal processing
- Invoice generation
- OpenProvider sync

## Monitoring & Observability

### Health Check
- `GET /health` - Returns server status, uptime, DB connection

### Logging
- Morgan HTTP request logging (combined format)
- Error logging with stack traces
- OpenProvider request/response (dev mode)

### Metrics (Future)
- Request latency
- Error rates
- OpenProvider API latency
- Database query performance