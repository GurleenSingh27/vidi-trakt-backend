# Vidi Trakt Backend (Vercel Edge Functions)

Endpoints:
- `POST /api/trakt/device` → get Trakt `user_code` + `device_code`
- `POST /api/trakt/poll`   → exchange `device_code` for tokens (after activation)
- `GET  /api/debug`        → env check (no secrets)
- `GET  /api/echo`         → request method echo (sanity)

## Deploy (Vercel)
1. Import this repo in Vercel as a **Project** (Framework: Other, Root Directory: blank).
2. Add Environment Variables (Preview + Production):
   - `TRAKT_CLIENT_ID` = your Trakt client id
   - `TRAKT_CLIENT_SECRET` = your Trakt client secret (Sensitive ON)
   - `ALLOWED_ORIGIN` = `https://GurleenSingh27.github.io`
3. Redeploy latest deployment.
4. Test:
   - `https://<your-backend>.vercel.app/api/echo`  → `{ "method":"GET" }`
   - `https://<your-backend>.vercel.app/api/debug` → shows origin + booleans
