# Future API Integration Guide

## Purpose
Frontend is mock-only now. This doc maps every frontend action to a future server-side endpoint and clarifies loading/error states. Swap `js/mock-data.js` internals to real `fetch` — UI unchanged.

## Current Mock Layer

`js/mock-data.js` exposes:

```js
MockAPI.searchDomain(domain) // -> { primary, alternatives, suggestions }
MockAPI.getPricing()         // -> TLD_PRICING[]
MockAPI.whoisLookup(domain)  // -> { available } | WHOIS record (privacy redacted)
MockAPI.calculateTotal(reg, years)
Cart.add / remove / updateYears / load / subtotal // localStorage key dr_cart_v1
```

Isolate logic there. UI (`domain-search.js`, `main.js`) never assumes mock shape beyond documented fields.

## Integration Points

### 1. Domain Search
- **Frontend:** form `data-domain-search-form` → `search-results.html?domain=...` → `MockAPI.searchDomain`
- **Future:** `POST /wp-json/domain-platform/v1/search` or `POST /api/domain/search`
- **Request:** `{ domain: "mybusiness.com" }`
- **Response:**
  ```json
  { "domain":"mybusiness.com","status":"available|taken|premium|reserved","registration":12.99,"renewal":14.99,"premium":false,"alternatives":[...],"suggestions":[...] }
  ```
- **States:** loading spinner (`#results-loading`), success card, taken/premium badges, error banner
- **Caching:** Debounce input (300ms), cache results 60s client-side; server should cache registrar responses per TTL

### 2. Pricing
- **Frontend:** `GET` mock pricing → filter by search/category
- **Future:** `GET /wp-json/domain-platform/v1/pricing` → `[{ tld, registration, renewal, transfer, category }]`
- **States:** table render, empty filter message
- **Note:** Never use "from" pricing — response must include both registration and renewal

### 3. Registration (Checkout)
- **Frontend:** `checkout.html` form + cart summary → mock success
- **Future:** `POST /wp-json/domain-platform/v1/domains/register` with `{ items:[{domain, years}], contact, paymentMethodMock }`
- **Response:** `{ orderId, invoices:[], domains:[] }` or `{ error, field }`
- **States:** validating → processing → success → redirect to dashboard; no real card data collected

### 4. Renewal
- **Frontend:** `domain-details.html` Renewal tab → term select + Renew
- **Future:** `POST /wp-json/domain-platform/v1/domains/{id}/renew` `{ years }`
- **States:** confirm modal, loading, success toast

### 5. Transfer
- **Frontend:** `transfer-domain.html` → `POST` mock
- **Future:** `POST /wp-json/domain-platform/v1/domains/transfer` `{ domain, authCode }`
- **Server validates:** domain unlocked, >60 days old, EPP format; returns eligibility + next steps (email confirmation)

### 6. DNS
- **Frontend:** `domain-details.html` DNS tab → mock table with Add/Edit/Delete
- **Future:**
  - `GET /wp-json/domain-platform/v1/domains/{id}/dns` → records
  - `POST /.../dns` / `PATCH /.../dns/{recordId}` / `DELETE /.../dns/{recordId}`
- **Record types:** A, CNAME, MX, TXT (extend: AAAA, NS, SRV); fields `type, host, value, ttl`

### 7. Nameservers
- **Frontend:** toggle default/custom + inputs
- **Future:** `PUT /wp-json/domain-platform/v1/domains/{id}/nameservers` `{ mode, nameservers[] }`

### 8. Contact / WHOIS
- **Frontend:** Contact tab shows redacted mock; WHOIS page redacts privacy
- **Future:** `GET /.../contact` and `PUT /.../contact`; server enforces privacy & validation

### 9. Accounts
- **Frontend:** `login.html` / `register.html` frontend validation only
- **Future:** WordPress auth or WHMCS SSO → `POST /wp-json/domain-platform/v1/auth/login`, `/register`, `/me`
- **States:** field errors, 401 handling, redirect to dashboard

### 10. Orders / Invoices
- **Frontend:** `billing.html` mock table
- **Future:** `GET /wp-json/domain-platform/v1/invoices` → `[{ id, date, description, amount, status }]`
- **Download:** `GET /.../invoices/{id}/pdf` (server-generated, authenticated)

## Generic Contract

- All requests: `Content-Type: application/json`, `Authorization: Bearer <token>` where needed (stored httpOnly cookie, never localStorage)
- All responses: `{ data, error }` with HTTP status; UI shows `toast` on error
- Loading: spinner + disabled button; Error: inline banner; Empty: dedicated empty-state card

## Security

- **Never in frontend:** registrar API keys, payment secrets, EPP storage, private keys
- Client validation ≠ security; server re-validates all inputs, rate-limits search/WHOIS, logs transfers
- WHOIS real data only server-side, redacted by default when privacy enabled

## Future Architectures

### Option A — WHMCS
```
Browser → WordPress Theme (this frontend) → Custom WP Plugin or WHMCS bridge → WHMCS → HostAfrica
```
Use when fastest launch & billing/client-area delegation is priority.

### Option B — Direct Plugin
```
Browser → WordPress Theme → Custom WordPress Plugin / API (PHP) → HostAfrica EPP/REST
```
Use when fully custom UX and direct registrar control are required.

Frontend stays compatible with either — same `fetch` abstraction, same payloads.
