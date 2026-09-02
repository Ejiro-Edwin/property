# TenantSea Backend

This is the initial backend scaffold for TenantSea, built with NestJS and TypeScript.

## Current structure
- Auth module
- Users module
- Properties module
- Tenancies module
- Payments module
- Trust module
- Audit module
- Notifications module

## Run locally
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

## API base
All endpoints are available under `/api/v1`.

The API listens on port `3100` by default so it does not conflict with the web
app on port `3000`.

## Swagger docs
OpenAPI docs are available at `/api/docs`.

## Environment variables
Copy `.env.example` to `.env` and update values as needed.

## Email notifications
Set `EMAIL_ENABLED=true` and configure `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` to enable SMTP emails (password reset and some payment notifications).
