# NRLS Risk Code Hotfix

## What changed

1. Replaced the sample Phase 2 seed risk codes with the complete official NRLS & HRMS on Cloud FY2565 risk code list from `NRLS.pdf`.
2. Seed now upserts all 315 NRLS records and keeps them active.
3. Risk codes not found in the NRLS list are marked inactive rather than deleted, to avoid breaking existing incident relations.
4. Incident Report Step 2 now filters Risk code options by the selected `Clinical / General` value.
5. Selecting a Risk code automatically sets:
   - `riskCodeId`
   - `clinicalOrGeneral`
   - `simpleCategory`

## Verification

After seeding, Prisma Studio should show 315 active records in `RiskCode` from the NRLS list.

```powershell
npx prisma studio
```

Or run:

```powershell
npx prisma db seed
```

Then test:

- Select `Clinical`: only `C...` codes should appear.
- Select `General`: only `G...` codes should appear.
- Search by code or Thai text.
- Click a Risk code: it should show selected state and fill the category automatically.
