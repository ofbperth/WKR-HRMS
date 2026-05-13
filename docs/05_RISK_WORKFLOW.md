# Risk Workflow

## Incident Report Workflow

1. Reporter, UnitManager, RMTeam, or Admin creates an incident from `/report/new`.
2. User selects Clinical or General, then selects a matching NRLS/risk code.
3. The system stores event time, reporter unit, incident unit, title, description, severity, optional patient HN/AN, and immediate action.
4. Incident number is generated in the format `RM-YYYY-0001`.
5. RMTeam/Admin triages new incidents.
6. Notifications and audit logs are created for important workflow actions.

## RM Triage Workflow

1. RM opens `/rm/triage` or incident detail.
2. RM reviews classification, severity, status, sentinel flag, and RM-support need.
3. RM may request RCA by setting the incident to an RCA-required state.
4. RM can export incident/RCA/action data where authorized.

## RCA Workflow

1. RM requests RCA when needed.
2. UnitManager opens the incident or `/unit/rca`.
3. UnitManager records problem statement, timeline, contributing factors, root cause, preventive action, KPI, KPI owner, and RM support request if needed.
4. UnitManager submits RCA.
5. RMTeam/Admin approves RCA or requests revision.

## Action Plan Workflow

1. After RCA approval, UnitManager creates action plan(s).
2. Action owner updates progress, evidence, KPI result, and effectiveness review.
3. RMTeam/Admin verifies completed action plans.
4. RMTeam/Admin closes the incident only after required actions are verified.

## Risk Status Lifecycle

Known operational flow:

```text
New -> RCARequired -> RCAInProgress -> RCAReview -> ActionPlanning -> ActionInProgress -> ActionVerification -> Closed
```

Need verification: exact status constants should be confirmed in `lib/types.ts` and route handlers before adding status automation or external integrations.

## Retention Lifecycle

Incident lifecycle states documented for retention:

```text
ACTIVE -> ARCHIVED -> SOFT_DELETED -> PENDING_HARD_DELETE_APPROVAL -> HARD_DELETE
```

Hard delete must not run automatically. Protected incidents are skipped or marked for review.

Protected conditions include unresolved cases, RCA/CAPA/action links, sentinel events, legal hold, and under-investigation flags.

## Severity Logic

Known high-severity escalation:

- Clinical severity `E` through `I`.
- General severity Level `3` through `5`.

Historical fix: General Level 3-5 should follow the same high-severity escalation path as Clinical E-I.

## NRLS / Risk Code Handling

- Seed includes 315 active NRLS records from the documented NRLS/HRMS FY2565 list.
- Risk code choices are filtered by Clinical/General selection.
- Selecting a risk code fills `riskCodeId`, `clinicalOrGeneral`, and `simpleCategory`.
- Risk codes removed from the seed list are marked inactive instead of deleted.

## 9 Safety Standards

The app includes RM and Executive safety-goal pages:

- `/rm/safety-goals`
- `/executive/safety-goals`

Need verification: exact mapping between risk codes and each safety standard should be checked against current seed data and hospital policy before production reporting.

