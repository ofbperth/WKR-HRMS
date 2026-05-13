# Security and PDPA

## Sensitive Data Fields

Known sensitive fields:

- HN
- AN
- RCA details / RCA narrative
- Reporter name
- Unit data where it can identify staff or patient context
- Free-text incident descriptions and comments if users type identifiers

## PDPA Design Principles

- Collect only data needed for risk reporting, triage, RCA, action tracking, analytics, audit, and governance.
- Minimize sensitive data in dashboards and exports.
- Keep Executive views aggregate-only.
- Use role and unit scope consistently in UI and direct APIs.
- Audit critical workflow, auth, export, sensitive reveal, and governance actions.
- Train users not to enter patient names or unnecessary identifiers in free-text fields.

## Data Minimization

Analytics fields such as severity, risk code, unit, status, category, sentinel flag, and dates remain plaintext so dashboards and reports can work without decrypting sensitive narratives.

Sensitive fields are handled separately through encryption, masking, or restricted reveal paths.

## Access Control

| Role | Sensitive-data expectation |
| --- | --- |
| Reporter | Own reports only; no broad sensitive reveal. |
| UnitManager | Own unit workflow only; sensitive reveal is restricted by policy. |
| RMTeam | Organization RM workflow; authorized sensitive access where needed. |
| Executive | Aggregate-only dashboards and reports. |
| Admin | System administration, audit oversight, and RM-level authority. |

HN/AN reveal is restricted to RMTeam/Admin and requires reason plus PDPA confirmation according to historical bug-fix notes.

## Encryption and Secret Handling

`lib/encryption.ts` provides:

- `encrypt()`
- `decrypt()`

It uses AES-256-GCM with random IV and stores JSON containing `ciphertext`, `iv`, and `authTag`.

Required production variable:

```env
ENCRYPTION_KEY="<32 random bytes, base64 or hex>"
```

Generate a local key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Never commit secrets, service role keys, database credentials, OAuth secrets, or encryption keys. Never expose secrets through `NEXT_PUBLIC_*`.

## Sensitive Backfill

After `ENCRYPTION_KEY` is set:

```bash
npm run security:backfill-sensitive
```

The documented backfill encrypts existing plaintext HN, AN, reporter name, and RCA narrative values and validates HN/AN decryption. It does not delete legacy plaintext.

## Audit Log

Audit logs cover:

- Login and Google account linking.
- Role changes and user deactivation.
- Incident create/update/review/status changes.
- RCA save/submit/approve/revision actions.
- Action plan updates and verification.
- Export and sensitive-data access.
- Auth settings and automation runs.

Audit values should redact passwords, HN/AN, encrypted fields, Google IDs, and RCA encrypted narrative.

## Supabase / RLS Hardening

Apply `prisma/supabase_rls_storage.sql` in staging before production. It is documented to:

- Enable and force RLS on app tables.
- Revoke direct `anon` and `authenticated` table access.
- Allow backend service-role access only.
- Make `AuditLog` append-only with update/delete blocking triggers.
- Create a private `risk-attachments-private` bucket.
- Restrict storage access to backend service-role operations.

Need verification: run direct anon/authenticated connection checks after applying policies.

## Storage and Retention Security

- Large binary files should be stored in private object storage, not PostgreSQL.
- Attachment downloads must use backend-generated signed URLs with 1 hour or shorter expiry.
- Temporary exports should expire quickly.
- Retention cleanup should start in dry-run mode:

```env
RETENTION_DRY_RUN=true
MAX_RETENTION_DELETE_PER_RUN=100
```

Hard delete requires Admin review and must not run automatically.

## Production Caution

- Do not use real patient data in development.
- Do not commit production secrets.
- Rotate secrets before go-live.
- Verify hospital PDPA, retention, deletion, and audit policies before production deployment.
- Live Google OAuth must be retested after production redirect URI and secrets are configured.

