# Phase 5 Authentication

## Architecture

Authentication follows the existing REST path: routes call controllers, controllers call `AuthService`, and the service uses `UserRepository` and `AuthSessionRepository` through the shared PostgreSQL pool.

## Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Registration and login return a public user object only. Access and refresh tokens are opaque values stored in `HttpOnly` cookies and are never returned in JSON or stored in frontend storage.

## Environment

Set `DATABASE_URL` to the PostgreSQL database and set a strong `AUTH_SECRET` outside development. `CORS_ORIGIN` must equal the frontend origin. Credentialed CORS is enabled for that configured origin only.

## Security

Passwords are stored as salted Node `scrypt` hashes. Session token hashes are stored in PostgreSQL, refresh tokens rotate, cookies use `HttpOnly` and `SameSite=Lax`, and production cookies use `Secure`. Authentication inputs are strictly validated and register/login endpoints are rate limited.

## Local development

From `backend`, run `npm run db:migrate`, then `npm run dev`. From `frontend`, run `npm run dev`. PostgreSQL must be running before migration or authenticated requests.