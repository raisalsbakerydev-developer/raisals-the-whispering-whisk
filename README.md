# Raisal's Bakery — Deployment-Ready Monorepo

This repository contains the React/Vite client and Express/PostgreSQL server for Raisal's Bakery.

## Local development

Install dependencies from the repository root:

```bash
npm install
```

Start the existing Express development server:

```bash
npm run dev
```

In a second terminal, start the Vite client:

```bash
npm --workspace client run dev
```

The client defaults to `http://localhost:5000/api` when `VITE_API_URL` is not set.

## Vercel-compatible local development

Install/login to Vercel CLI if needed, then run:

```bash
npm run build
npx vercel dev
```

This exercises the root Vercel configuration, including the `/api` Express function and the built Vite frontend.

## Production build

```bash
npm run build
```

## Database migrations

Run migrations from the repository root after configuring `server/.env`:

```bash
npm run migrate
```

Run migration `023_bakery_operations.sql` before using bakery operating-hours/closure features if it has not already been applied to the Neon database.

## Vercel deployment

Use the repository root as the Vercel project root. The root `vercel.json` builds `client/dist` and exposes the Express application through `/api`.

Set the production environment variables in Vercel. In particular, use the production frontend URL for `CLIENT_URL` and the exact production Google OAuth callback URL for `GOOGLE_REDIRECT_URI`:

```text
https://<your-domain>/api/auth/google/callback
```

Do not commit real `.env` files or secrets.
