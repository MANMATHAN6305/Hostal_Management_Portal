# Deploy on Render

This repository is prepared for Render Blueprint deploy using `render.yaml`.

## Before You Deploy

1. Push latest code to GitHub.
2. Create a MySQL database (Render does not provide managed MySQL natively).
3. Keep your MySQL connection values ready:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_SSL` (`true` for most hosted MySQL providers)

## Deploy with Blueprint

1. In Render dashboard, click `New +` -> `Blueprint`.
2. Connect this GitHub repository.
3. Render detects `render.yaml` and creates:
   - `hostel-portal-backend` (Node web service)
   - `hostel-portal-frontend` (static site)
4. Enter required environment values when prompted.

## Required Environment Variables

### Backend service (`hostel-portal-backend`)

Set these in Render service environment settings:

- `NODE_ENV=production`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`
- `JWT_SECRET`
- `FRONTEND_URL` (your frontend Render URL)

### Frontend service (`hostel-portal-frontend`)

- `VITE_API_BASE_URL=https://<your-backend-service>.onrender.com/api`

## Post-Deploy Wiring

1. Deploy backend first and copy backend URL.
2. Set frontend `VITE_API_BASE_URL` using backend URL + `/api`.
3. Deploy frontend and copy frontend URL.
4. Set backend `FRONTEND_URL` using frontend URL.
5. Re-deploy backend once after updating `FRONTEND_URL`.

## Health Check

- Backend root path `/` returns a JSON welcome message.

## Local files for reference

- `backend/.env.example`
- `frontend/.env.example`
- `render.yaml`
