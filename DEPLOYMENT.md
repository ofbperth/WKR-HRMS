# Deployment Guide

## Production Target

Use PostgreSQL for production. SQLite is acceptable only for local development or demo.

## Environment

Required variables:

```env
DATABASE_URL="postgresql://hrms_user:strong-password@localhost:5432/hrms?schema=public"
AUTH_SECRET="minimum-32-character-secret"
NEXTAUTH_SECRET="minimum-32-character-secret"
NEXTAUTH_URL="https://your-domain.com"
APP_BASE_URL="https://your-domain.com"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
SEED_DEV_USERS="false"
```

Rotate any Google secret that was shared outside the server environment before go-live.

## Build And Migrate

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed:prod
npm run build
npm run start
```

## VPS Notes

- Run Node.js 20 LTS or later.
- Put the app behind Nginx or another reverse proxy.
- Enforce HTTPS before enabling production Google OAuth.
- Restrict `.env` permissions to the deployment user.
- Back up PostgreSQL daily and before every migration.

## Reverse Proxy Sketch

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## Cron / Automation

Use protected app endpoints through an internal scheduler or run manual jobs from `/admin/automation`.

Recommended schedule:

- overdue action check: daily 07:00
- due soon notification: daily 07:10
- status sync: hourly
- notification cleanup: weekly

Do not expose automation endpoints publicly without the normal authenticated session controls.
