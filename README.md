# WKR-HRMS

Hospital Risk Report & Management System for incident reporting, risk log review, RCA tracking, dashboards, and RM governance.

## Tech Stack

| Area | Stack |
| --- | --- |
| App | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, lucide-react, Recharts |
| Forms/validation | React Hook Form, Zod |
| Data | Prisma, SQLite for local development |
| Auth/session | JWT session cookies, credential login, optional Google OAuth |
| Testing | Vitest, manual QA checklist |

## Core Features

- Role-based workflows for Reporter, UnitManager, RMTeam, Executive, and Admin.
- Incident reporting with NRLS risk codes, severity, SIMPLE category, and optional patient identifiers.
- RM triage, RCA review, action plan verification, closure workflow, comments, notifications, and audit logging.
- Unit, RM, Executive, heatmap, trend, safety-goal, and monthly-report dashboards.
- PDPA-minded sensitive-data handling, masking, encryption utilities, signed exports, retention, and governance notes.

## Quick Start

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env` from `.env.example`. Local development normally uses SQLite:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-super-secret-minimum-32-chars"
ENCRYPTION_KEY="<32-byte-base64-or-hex-key>"
APP_BASE_URL="http://localhost:3000"
```

Production values, OAuth credentials, encryption keys, and database credentials must be configured outside source control.

## Documentation

Detailed documentation is in [docs/README.md](docs/README.md).

Start with:

- [Project overview](docs/00_PROJECT_OVERVIEW.md)
- [Local development](docs/01_LOCAL_DEVELOPMENT.md)
- [Architecture](docs/02_APP_ARCHITECTURE.md)
- [Security and PDPA](docs/07_SECURITY_PDPA.md)
- [Deployment prep](docs/08_DEPLOYMENT_PREP.md)

## Current Status

The project is functionally ready for continued development and staging validation. Production deployment still requires environment verification, secret rotation, production database migration checks, OAuth callback verification, backup/restore confirmation, and hospital PDPA policy review.

## Safety Note

This system may contain sensitive hospital incident data. Do not commit real patient identifiers, production secrets, service-role keys, database credentials, or real RCA narratives.
