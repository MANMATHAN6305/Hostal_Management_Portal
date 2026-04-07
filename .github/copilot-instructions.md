# Project Guidelines

## Code Style
- Backend code in [backend/src/](../backend/src/) uses CommonJS (`require` / `module.exports`) and semicolons. Keep new server-side files consistent with the surrounding modules.
- Frontend code in [frontend/src/](../frontend/src/) uses TypeScript, React function components, and Vite. Follow the existing JSX and import style in [frontend/src/App.tsx](../frontend/src/App.tsx) and the page/component files.
- Keep naming aligned to the domain language already used in the app: hostel, room, allocation, application, complaint, request, student, staff, warden.

## Architecture
- Backend entrypoint: [backend/src/index.js](../backend/src/index.js). Route modules live in [backend/src/routes/](../backend/src/routes/), Sequelize models in [backend/src/models/](../backend/src/models/), migrations in [backend/src/migrations/](../backend/src/migrations/), and seed scripts in [backend/src/seeds/](../backend/src/seeds/).
- Frontend entrypoint: [frontend/src/main.tsx](../frontend/src/main.tsx) and [frontend/src/App.tsx](../frontend/src/App.tsx). Route protection lives in [frontend/src/components/auth/ProtectedRoute.tsx](../frontend/src/components/auth/ProtectedRoute.tsx), and the API client is in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts).
- Use the existing docs instead of duplicating them: [SMART_HOSTEL_PORTAL_SPEC.md](../SMART_HOSTEL_PORTAL_SPEC.md), [DEPLOY_RENDER.md](../DEPLOY_RENDER.md), [backend/src/config/DATABASE_SCHEMA.md](../backend/src/config/DATABASE_SCHEMA.md), and [backend/src/seeds/README_HOSTELS.md](../backend/src/seeds/README_HOSTELS.md).

## Build and Test
- Backend: `cd backend`, `npm install`, `npm run dev`, `npm start`, `npm run migrate:*`, `npm run seed:*`.
- Backend tests are not implemented yet; `npm test` currently exits with a placeholder error.
- Frontend: `cd frontend`, `npm install`, `npm run dev`, `npm run build`, `npm run preview`.

## Conventions
- Call `dotenv.config()` inside backend modules that depend on environment variables at import time, especially migrations and seed scripts.
- Keep schema changes in migrations or seed scripts; avoid adding `Model.sync({ alter: true })` inside request handlers.
- Keep frontend API base URLs environment-aware through `VITE_API_BASE_URL`; do not hardcode localhost for deployed builds.
- Normalize enum-like payloads at route boundaries, especially role and gender fields, to avoid production-only insert failures.
- Use `FRONTEND_URL` for OAuth redirects and callback failures rather than hardcoded local URLs.
