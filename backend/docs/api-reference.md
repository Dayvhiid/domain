# API Reference

Base URL: `https://api.yourdomain.com/api/v1`

All endpoints require authentication unless noted. Include session cookie or `Authorization: Bearer <token>`.

---

## Authentication

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "emailVerified": false,
      "preferences": { ... },
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "openProvider": {
      "resellerId": 12345,
      "token": "abc123..."
    }
  }
}
```
Sets cookie: `dr_session=...; HttpOnly; Secure; SameSite=Lax`

### Get Current User
```http
GET /auth/me
Cookie: dr_session=...
```

### Update Profile
```http
PUT /auth/profile
Cookie: dr_session=...
Content-Type: application/json

{
  "firstName": "Jane",
  "preferences": {
    "currency": "EUR",
    "notifications": { "email": true, "domainExpiry": true }
  }
}
```

### Change Password
```http
PUT /auth/password
Cookie: dr_session=...
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456"
}
```

### Logout
```http
POST /auth/logout
Cookie: dr_session=...
```

---

## Domains

### Search Domain
```http
GET /domains/search?domain=example.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "primary": {
      "domain": "example.com",
      "sld": "example",
      "tld": ".com",
      "available": true,
      "premium": false,
      "status": "available",
      "pricing": {
        "registration": 12.99,
        "renewal": 14.99,
        "transfer": 12.99,
        "currency": "USD"
      }
    },
    "alternatives": [
      { "domain": "example.net", "tld": ".net", "status": "available", "pricing": {...} }
    ],
    "suggestions": [
      { "domain": "myexample.com", "status": "available", "pricing": {...} }
    ]
  }
}
```

### Check Domain Availability
```http
POST /domains/check
Content-Type: application/json

{
  "domain": "example.com",
  "operation": "register",
  "period": 1
}
```

### Get Domain Pricing
```http
GET /domains/pricing?domain=example.com&operation=register&period=1
```

### WHOIS Lookup
```http
POST /domains/whois
Content-Type: application/json

{
  "domain": "example.com"
}
```

### List User Domains
```http
GET /domains?status=active&limit=20&offset=0&expiringSoon=false
```

### Get Domain Details
```http
GET /domains/:id?fresh=true
```

### Register Domain
```http
POST /domains/register
Content-Type: application/json

{
  "domainName": "mybusiness",
  "extension": ".com",
  "years": 2,
  "whoisPrivacy": true,
  "autoRenew": true,
  "contacts": {
    "registrant": "contact_id",
    "admin": "contact_id"
  },
  "nameservers": [
    { "hostname": "ns1.example.com" },
    { "hostname": "ns2.example.com" }
  ],
  "orderId": "order_id"
}
```

### Transfer Domain
```http
POST /domains/transfer
Content-Type: application/json

{
  "domainName": "mybusiness",
  "extension": ".com",
  "authCode": "ABC123-XYZ789",
  "whoisPrivacy": true,
  "autoRenew": true,
  "contacts": { ... }
}
```

### Renew Domain
```http
POST /domains/:id/renew
Content-Type: application/json

{
  "years": 1
}
```

### Update Domain
```http
PUT /domains/:id
Content-Type: application/json

{
  "autoRenew": false,
  "whoisPrivacy": true,
  "nameserverGroup": "my-ns-group",
  "nameservers": [
    { "hostname": "ns1.newhost.com", "ipv4": "1.2.3.4" }
  ]
}
```

### Get Auth Code
```http
GET /domains/:id/auth-code
```

### Delete Domain
```http
DELETE /domains/:id?type=immediate&skipSoftQuarantine=false&forceDelete=false
```

### Dashboard Stats
```http
GET /domains/dashboard/stats
```

---

## DNS

### List Nameservers
```http
GET /dns/nameservers?limit=100&offset=0&pattern=ns1*
```

### Create Nameserver
```http
POST /dns/nameservers
Content-Type: application/json

{
  "name": "ns1.myhost.com",
  "ip": "1.2.3.4",
  "ip6": "2001:db8::1"
}
```

### List Nameserver Groups
```http
GET /dns/nameserver-groups?withDomainCount=true&withNsCount=true
```

### Create Nameserver Group
```http
POST /dns/nameserver-groups
Content-Type: application/json

{
  "name": "my-ns-group",
  "nameservers": [
    { "hostname": "ns1.myhost.com", "ipv4": "1.2.3.4" },
    { "hostname": "ns2.myhost.com", "ipv4": "5.6.7.8" }
  ],
  "isDefault": true
}
```

### Get Nameserver Group
```http
GET /dns/nameserver-groups/my-ns-group
```

### Update Nameserver Group
```http
PUT /dns/nameserver-groups/my-ns-group
Content-Type: application/json

{
  "nameservers": [
    { "hostname": "ns1.updated.com", "ipv4": "1.2.3.4" }
  ],
  "isDefault": true
}
```

### Set Default Nameserver Group
```http
POST /dns/nameserver-groups/my-ns-group/default
```

### Delete Nameserver Group
```http
DELETE /dns/nameserver-groups/my-ns-group
```

### Create Domain Token
```http
POST /dns/domain-token
Content-Type: application/json

{
  "domainName": "example",
  "extension": ".com"
}
```

### Sync from OpenProvider
```http
POST /dns/sync
```

---

## Cart

### Get Cart
```http
GET /cart
Cookie: dr_session=...
```

### Add Item
```http
POST /cart/items
Content-Type: application/json

{
  "domainName": "mybusiness",
  "extension": ".com",
  "price": { "registration": 12.99, "renewal": 14.99, "currency": "USD" },
  "years": 1,
  "options": { "whoisPrivacy": true, "autoRenew": true }
}
```

### Update Item Years
```http
PUT /cart/items/example.com/years
Content-Type: application/json

{ "years": 2 }
```

### Update Item Options
```http
PUT /cart/items/example.com/options
Content-Type: application/json

{ "whoisPrivacy": false, "nameserverGroup": "my-group" }
```

### Remove Item
```http
DELETE /cart/items/example.com
```

### Clear Cart
```http
DELETE /cart
```

### Apply Coupon
```http
POST /cart/coupon
Content-Type: application/json

{
  "code": "SAVE10",
  "discountType": "percentage",
  "discountValue": 10,
  "expiresAt": "2026-12-31"
}
```

### Get Checkout Summary
```http
GET /cart/checkout-summary
```

---

## Orders

### Create Order from Cart
```http
POST /orders
Content-Type: application/json

{
  "paymentProvider": "paystack"
}
```

### List Orders
```http
GET /orders?status=completed&limit=20&offset=0
```

### Get Order
```http
GET /orders/:id
```

### Get Order by Number
```http
GET /orders/number/DR240815-ABC123
```

### Initiate Payment
```http
POST /orders/:id/pay
```

### Cancel Order
```http
POST /orders/:id/cancel
Content-Type: application/json

{ "reason": "Customer cancelled" }
```

---

## Users

### Get Profile
```http
GET /users/profile
```

### Update Profile
```http
PUT /users/profile
Content-Type: application/json

{ "firstName": "Jane", "preferences": { "currency": "EUR" } }
```

### Change Password
```http
PUT /users/password
Content-Type: application/json

{ "currentPassword": "old", "newPassword": "new" }
```

### Dashboard
```http
GET /users/dashboard
```

---

## Contacts

### List Contacts
```http
GET /contacts?type=registrant&limit=20
```

### Create Contact
```http
POST /contacts
Content-Type: application/json

{
  "type": "registrant",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "phoneCc": "+1",
  "organization": "Example Inc",
  "organizationType": "company",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }
}
```

### Get Contact
```http
GET /contacts/:id
```

### Update Contact
```http
PUT /contacts/:id
Content-Type: application/json

{ "phone": "+1987654321" }
```

### Delete Contact
```http
DELETE /contacts/:id
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `BAD_GATEWAY` | 502 | Upstream API error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### OpenProvider Specific Codes
| Code | Description |
|------|-------------|
| `OPENPROVIDER_AUTH_FAILED` | Invalid OpenProvider credentials |
| `OPENPROVIDER_TOKEN_EXPIRED` | Token needs refresh |
| `OPENPROVIDER_RATE_LIMIT` | OpenProvider rate limit hit |
| `DOMAIN_NOT_AVAILABLE` | Domain cannot be registered |
| `DOMAIN_TRANSFER_FAILED` | Transfer rejected |
| `INVALID_AUTH_CODE` | Auth code invalid/expired |

---

## Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 req | 15 min |
| Auth (login/register) | 10 req | 15 min |
| Domain Check/Search | 30 req | 1 min |
| Payments | 20 req | 1 hour |

---

## Webhooks (v2)

```
POST /webhooks/paystack
POST /webhooks/flutterwave
POST /webhooks/payfast
```

Headers: `X-Webhook-Signature` for verification