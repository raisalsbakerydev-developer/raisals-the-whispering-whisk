# Raisal's Bakery — Deployment Notes

## Local development

Keep the existing development workflow:

```bash
npm install
npm run dev
```

The API runs on `http://localhost:5000`.

For Vercel's local runtime, install the Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

Vercel currently supports Express applications directly, so the existing Express application structure is intentionally preserved rather than rewritten into one function per route.

## Vercel backend project

Use the `server` directory as the Vercel project root. Vercel can deploy the existing Express/Node server directly.

Set these Production environment variables in Vercel:

- `NODE_ENV=production`
- `CLIENT_URL=https://<your-production-client-domain>`
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI=https://<your-production-backend-domain>/api/auth/google/callback`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `CLOUDINARY_AVATAR_FOLDER`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `ADMIN_BOOTSTRAP_SECRET`

Do not commit a real `.env` file.

## Database migrations

Run migrations explicitly against the Neon database before production testing:

```bash
npm run migrate
```

Migration `023_bakery_operations.sql` is included in this package.

## Google OAuth

The production Google OAuth redirect URI must exactly match the backend production callback URL:

`https://<your-production-backend-domain>/api/auth/google/callback`

The backend then redirects the authenticated user to `CLIENT_URL`.
