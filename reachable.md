# Making This Project Reachable for Codex

Codex can work with this repository most reliably when the project folder, temp folder, and toolchain all live in locations the sandbox can read and write.

## Recommended Workspace

Keep the repo here:

```text
C:\DEV\hrms-project\WKR-HRMS
```

Allow Codex read/write access to:

```text
C:\DEV\hrms-project\WKR-HRMS
C:\TMP
```

Use `C:\TMP` as the working/temp fallback when commands fail from the repo root.

## Git Safe Directory

If Git reports dubious ownership, use a per-command safe-directory override instead of changing global config:

```powershell
git -c safe.directory=C:/DEV/hrms-project/WKR-HRMS -C C:\DEV\hrms-project\WKR-HRMS status
```

## PowerShell Command Pattern

If launching directly inside the project fails, run commands from `C:\TMP` and then change into the project:

```powershell
$env:TEMP='C:\TMP'
$env:TMP='C:\TMP'
$env:USERPROFILE='C:\TMP'
Set-Location C:\DEV\hrms-project\WKR-HRMS
npm run dev
```

The temp/userprofile redirects help tools such as Prisma and Next avoid blocked profile paths.

## Prisma Notes

Prisma may need normal local shell access to spawn its engines and update generated client files:

```powershell
npx prisma generate --schema prisma\schema.prisma
npx prisma migrate dev
```

If Codex sees `EPERM` from Prisma, run those two commands manually in a local terminal with the same environment variables above.

## Required Environment

Create `.env` from `.env.example` and set:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-super-secret-minimum-32-chars"
ENCRYPTION_KEY="<32-byte-base64-or-hex-key>"
```

Generate `ENCRYPTION_KEY`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Do not prefix secrets with `NEXT_PUBLIC_`.

## Quick Health Check

After permissions and environment are ready:

```powershell
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Then open:

```text
http://localhost:3000
```
