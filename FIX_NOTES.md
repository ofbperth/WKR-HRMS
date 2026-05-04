# Phase 2 hotfix: SQLite Prisma enum issue

## Fixed

Prisma + SQLite does not support native `enum` fields. The original Phase 2 schema defined `enum Role`, `enum Severity`, `enum IncidentStatus`, etc., which caused:

```text
Error validating: You defined the enum `Role`. But the current connector does not support enums.
```

This hotfix changes enum-like DB columns to `String` fields and keeps strict validation in TypeScript/Zod via `lib/types.ts` and `lib/validators.ts`.

## Important reset command

If you already ran migrate/seed with the old broken package, delete the generated local DB and migration state before retrying:

PowerShell:

```powershell
Remove-Item -Recurse -Force .\prisma\migrations -ErrorAction SilentlyContinue
Remove-Item -Force .\prisma\dev.db -ErrorAction SilentlyContinue
Remove-Item -Force .\prisma\dev.db-journal -ErrorAction SilentlyContinue
```

Then run:

```powershell
npm install
Copy-Item .env.example .env -Force
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run build
npm run dev
```
