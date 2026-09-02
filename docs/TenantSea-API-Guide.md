## TenantSea Backend API Guide

This document explains what each API endpoint does, who can call it, and includes copy/paste examples.

### Base URL, versioning, and docs

- **Base URL**: `/api/v1`
- **Swagger UI**: `/api/docs`
- **OpenAPI JSON**: `/api/docs-json`

### Authentication

- Most endpoints require a JWT in: `Authorization: Bearer <accessToken>`
- Login returns `accessToken`.

### Multi-tenancy (`tenantId`)

- The system supports multiple organizations (“tenants”) in one database.
- Most requests include `tenantId` (in JSON body for POST or query string for GET).
- The backend compares request `tenantId` to the JWT `tenantId` and rejects mismatches.

---

## Health

### GET `/health`

Checks the API and DB connectivity.

Example:

```bash
curl -s http://localhost:3100/api/v1/health
```

Response:

```json
{ "status": "ok", "db": "up" }
```

---

## Auth

### POST `/auth/register`

Creates a **new workspace** with the registrant as its landlord and sends an
email verification link. Fails if the workspace already exists — joining an
existing workspace happens exclusively through invitations (see Invites).

Body fields:
- `tenantId` (workspace handle: lowercase letters, numbers, hyphens), optional `workspaceName`, `name`, `email`, `password`, optional `phone`

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "workspaceName": "Acme Properties Ltd",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'
```

### POST `/auth/verify-email`

Verifies a user’s email using the token from the verification email.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{ "token": "verification_token_here", "tenantId": "acme-corp" }'
```

### POST `/auth/resend-verification`

Re-sends the verification email.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "tenantId": "acme-corp" }'
```

### POST `/auth/login`

Logs in using email/password (optionally include `tenantId` if the same email can exist in multiple tenants).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "password": "SecurePass123!", "tenantId": "acme-corp" }'
```

Response contains:
- `accessToken` (JWT)
- `user`

### GET `/auth/me` (JWT required)

Returns your profile from the token (safe fields only), your **active operating profile**, and all **profiles** you may switch to.

A single account can hold multiple operating profiles in one workspace — for example `landlord`, `letting_agent` (agent), and `tenant`. The active profile controls permissions and UI mode for the session.

Example:

```bash
curl -s http://localhost:3100/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

Example response:

```json
{
  "user": {
    "id": "...",
    "email": "jane@example.com",
    "role": "landlord",
    "activeRole": "landlord"
  },
  "profiles": ["landlord", "letting_agent", "tenant"]
}
```

### POST `/auth/switch-profile` (JWT required)

Switch the **active operating profile** for this session. Returns a new `accessToken` — replace your stored token (same as login).

Body:

```json
{ "role": "tenant" }
```

Allowed values: `tenant`, `landlord`, `letting_agent`, `admin` (only if you have that profile grant).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/switch-profile \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "role": "letting_agent" }'
```

Profile grants are added when you register, accept an invite, or are linked on a property/tenancy (e.g. as landlord, agent, or renter).

### POST `/auth/forgot-password`

Issues a reset token (stored in DB) and emails a reset link. Response is always generic.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "jane@example.com", "tenantId": "acme-corp" }'
```

### POST `/auth/reset-password`

Resets password using the reset token.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{ "token": "abc123resettoken", "password": "NewSecurePass123!", "tenantId": "acme-corp" }'
```

---

## Invites

Workspace membership is invitation-based: landlords/admins can invite any
role, letting agents can invite tenants only. Invitations expire after 7 days.

### POST `/invites` (JWT, roles: landlord, admin, letting_agent)

Sends an invitation email with an accept link. Re-inviting the same email
refreshes the pending invitation.

```bash
curl -s -X POST http://localhost:3100/api/v1/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "tenantId": "acme-corp", "email": "tenant@example.com", "name": "John Tenant", "role": "tenant" }'
```

### GET `/invites?tenantId=acme-corp` (JWT, roles: landlord, admin, letting_agent)

Lists invitations with their status (`pending`, `accepted`, `revoked`).

### POST `/invites/:id/revoke` (JWT, roles: landlord, admin)

Revokes a pending invitation. Body: `{ "tenantId": "acme-corp" }`.

### GET `/invites/preview?token=...` (public)

Returns the invite's email, role and workspace so the accept page can
render before sign-up.

### POST `/invites/accept` (public)

The invitee sets their name and password and becomes a workspace user.
Their email is marked verified automatically.

```bash
curl -s -X POST http://localhost:3100/api/v1/invites/accept \
  -H "Content-Type: application/json" \
  -d '{ "token": "invite_token_here", "name": "John Tenant", "password": "SecurePass123!" }'
```

---

## Users (JWT + tenant-scoped)

All endpoints in this section require:
- `Authorization: Bearer <accessToken>`
- `tenantId` query/body matching your JWT tenant

### POST `/users` (Roles: `ADMIN`, `LANDLORD`, `LETTING_AGENT`)

Creates a user in the tenant (password is hashed).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "name": "New Tenant",
    "email": "newtenant@example.com",
    "password": "SecurePass123!",
    "role": "tenant"
  }'
```

### GET `/users?tenantId=...&page=...&limit=...&search=...`

Lists users.

Example:

```bash
curl -s "http://localhost:3100/api/v1/users?tenantId=acme-corp&page=1&limit=20" \
  -H "Authorization: Bearer <accessToken>"
```

### GET `/users/:id?tenantId=...`

Gets a user by id.

---

## Properties (JWT + tenant-scoped)

### POST `/properties` (Roles: `LANDLORD`, `LETTING_AGENT`, `ADMIN`)

Creates a property record for the tenant.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/properties \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "title": "2-bed flat in Camden",
    "address": "12 High Street, London",
    "landlordId": "<userId>",
    "bedrooms": 2,
    "rentAmount": 1500,
    "currency": "GBP"
  }'
```

### GET `/properties?tenantId=...&page=...&limit=...&search=...`

Lists properties.

### GET `/properties/:id?tenantId=...`

Returns one property with its amenities and house rules. Tenant users can only
read properties connected to one of their own tenancies.

---

## Tenancies (JWT + tenant-scoped)

### POST `/tenancies` (Roles: `LANDLORD`, `LETTING_AGENT`, `ADMIN`)

Creates a tenancy (linking tenant user, landlord, and property).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/tenancies \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "propertyId": "<propertyId>",
    "tenantUserId": "<tenantUserId>",
    "landlordId": "<landlordId>",
    "rentAmount": 1500,
    "currency": "GBP",
    "startDate": "2026-01-01",
    "status": "active"
  }'
```

### GET `/tenancies?tenantId=...&page=...&limit=...&search=...`

Lists tenancies.

---

## Payments (JWT + tenant-scoped)

### POST `/payments/initiate`

Creates a payment record (does not charge a provider; it records intent + metadata).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/payments/initiate \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "tenancyId": "<tenancyId>",
    "payerId": "<payerUserId>",
    "amount": 1500,
    "currency": "GBP",
    "provider": "flutterwave",
    "reference": "pay_ref_123",
    "dueDate": "2026-02-01",
    "status": "pending"
  }'
```

### POST `/payments/verify` (Roles: `LANDLORD`, `ADMIN`)

Manually verifies/updates a payment’s status and verified amount.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/payments/verify \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "paymentId": "<paymentId>",
    "status": "paid",
    "verifiedAmount": 1500
  }'
```

### POST `/payments/schedules`

Creates a recurring payment schedule for a tenancy (and creates a notification).

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/payments/schedules \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "acme-corp",
    "tenancyId": "<tenancyId>",
    "amount": 1500,
    "currency": "GBP",
    "frequency": "monthly",
    "nextDueDate": "2026-02-01"
  }'
```

### GET `/payments/schedules?tenantId=...&tenancyId=...`

Lists schedules.

### POST `/payments/reconcile?tenantId=...` (Roles: `LANDLORD`, `ADMIN`)

Checks for overdue schedules and creates notifications for those missing a PAID payment at the due date.

### GET `/payments/history?tenantId=...&tenancyId=...&page=...&limit=...`

Lists payments.

### GET `/tenancies/:id?tenantId=...`

Returns one tenancy with its property, amenities, rules, and linked users.
Tenant users can only read their own tenancy records.

---

## Trust (JWT + tenant-scoped)

### GET `/trust/dashboard?tenantId=...` (Roles: `LANDLORD`, `ADMIN`, `LETTING_AGENT`)

Returns a landlord-style dashboard summary based on payments and tenancies.

### GET `/trust/:tenantUserId?tenantId=...`

Returns a trust profile for a tenant user:
- Privileged roles can view any profile in the tenant.
- Tenants can view their own profile only.

---

## Audit (JWT + tenant-scoped)

### GET `/audit?tenantId=...` (Role: `ADMIN`)

Lists the latest audit logs (currently returns the last 100 records).

---

## Documents, messages, payment methods, and property details (JWT + tenant-scoped)

### GET `/documents?tenantId=...&propertyId=...&tenancyId=...`

Lists workspace documents. Tenants see documents owned by them or attached to
their tenancy/property; privileged workspace roles see all documents.

### POST `/documents` (Roles: `LANDLORD`, `LETTING_AGENT`, `ADMIN`)

Creates a document record from a storage URL. The API intentionally stores file
metadata and a URL; binary storage is supplied by the deployment's storage
provider rather than written to the application server.

```bash
curl -s -X POST http://localhost:3100/api/v1/documents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tenantId":"acme-corp","name":"Lease agreement","category":"lease","url":"https://storage.example/lease.pdf","mimeType":"application/pdf","propertyId":"property_id"}'
```

### DELETE `/documents/:id?tenantId=...`

Deletes a document. The uploader may delete their own document; privileged
roles may delete any document in the workspace.

### POST `/documents/:id/share` (Roles: `LANDLORD`, `LETTING_AGENT`, `ADMIN`)

Shares a document with a workspace user. Body: `{ "tenantId": "acme-corp", "userId": "user_id", "canEdit": false }`.

### PATCH `/documents/:id/visibility`

Changes document visibility between `PRIVATE` and `WORKSPACE`. The uploader or
a privileged workspace role can change visibility.

### GET `/messages?tenantId=...&unread=true|false`

Lists messages. Tenants see conversations they sent or received; privileged
roles see workspace messages.

### POST `/messages`

Sends a message. Body: `{ "tenantId": "acme-corp", "body": "...", "recipientId": "user_id" }`.
Omit `recipientId` for a workspace-wide message.

### PATCH `/messages/:id/read`

Marks a received message read or unread. Body: `{ "tenantId": "acme-corp", "read": true }`.

### GET `/payment-methods?tenantId=...`

Lists the authenticated user's saved payment methods. Card numbers are never
accepted or stored; only provider references and display metadata are stored.

### POST `/payment-methods`, PATCH `/payment-methods/:id`, DELETE `/payment-methods/:id`

Creates, updates, or removes a user's payment method. Create body:
`{ "tenantId": "acme-corp", "type": "card", "label": "Visa ending 4242", "last4": "4242", "provider": "stripe", "providerRef": "pm_...", "isDefault": true }`.

### GET `/properties/:propertyId/amenities` and `/properties/:propertyId/rules`

Lists property amenities and house rules. Privileged roles can add them with
`POST` and remove them with `DELETE` using the same nested paths. Amenity body:
`{ "tenantId": "acme-corp", "name": "Parking" }`; rule body:
`{ "tenantId": "acme-corp", "name": "No smoking", "details": " indoors" }`.

## Settings (JWT + tenant-scoped)

### GET `/settings?tenantId=...`

Returns the authenticated user's lease, payment, notification, and privacy
preferences. Missing preferences return empty objects.

### PATCH `/settings`

Partially updates settings. Body fields are optional JSON objects:
`leasePreferences`, `paymentPreferences`, `notificationPreferences`, and
`privacyPreferences`, plus required `tenantId`.

### POST `/auth/change-password` (JWT required)

Changes the authenticated user's password after verifying the current password.
Body: `{ "currentPassword": "...", "newPassword": "..." }`.

## Maintenance (JWT + tenant-scoped)

### GET `/maintenance?tenantId=...&status=...`

Lists maintenance requests. Tenants see requests they reported or requests
linked to their tenancy; privileged workspace roles see all requests.

### GET `/maintenance/:id?tenantId=...`

Returns one maintenance request with its property, tenancy, requester, and
assignee.

### POST `/maintenance`

Creates a request. Body: `{ "tenantId": "acme-corp", "title": "Leaking tap", "description": "Kitchen tap is dripping", "propertyId": "property_id", "tenancyId": "tenancy_id", "priority": "normal" }`.

### PATCH `/maintenance/:id`

Updates status, priority, or assignee. Status values are `open`, `in_progress`,
`resolved`, and `closed`; priority values are `low`, `normal`, `high`, and
`urgent`.

## Notifications (JWT + tenant-scoped)

### GET `/notifications?tenantId=...&userId=...&read=true|false&page=...`

Lists notifications. Non-privileged users only see their own notifications.

### POST `/notifications/:id/read`

Marks a notification read/unread.

Example:

```bash
curl -s -X POST http://localhost:3100/api/v1/notifications/<id>/read \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{ "tenantId": "acme-corp", "read": true }'
```

---

## Realtime (Socket.IO)

The server emits two main event channels:
- `notification` (payload includes `event: notification:created|notification:updated`)
- `payment:update` (payload includes `event: payment:updated`)

