# Risk Register Outsider Review

## 1. What was implemented

- Added Prisma models `RiskRegister`, `RiskIncidentLink`, and `RiskReview` with indexes and a migration.
- Added risk APIs under `app/api/risks/*` for list, create, detail, update, approve, reject, merge, link, unlink, review, close, and accept.
- Added UI routes:
  - `/unit/risks`
  - `/unit/risks/proposals`
  - `/unit/risks/[id]`
  - `/rm/risks`
  - `/rm/risks/proposals`
  - `/rm/risks/[id]`
  - `/executive/risks`
- Added navigation for UnitManager, RMTeam, Admin, and Executive. Reporter still has no Risk Register menu.
- Added incident integration so RM/Admin/UnitManager can view related risks from incident detail and create/link risks from there.
- Added unit dashboard risk widget: high or extreme, review due, overdue, and open actions.
- Added rule-based RM suggestions for repeated incident clusters over 90 days.

## 2. Workflow

1. Incident is reported and triaged as before.
2. RM/Admin/UnitManager can link an incident to an existing risk from incident detail.
3. UnitManager can create a unit `PROPOSED` risk only.
4. RM/Admin can create hospital risk directly or review proposals.
5. RM/Admin can approve, reject, or merge a proposal into an existing risk. Merge moves links first, then rejects the proposal with a merge note.
6. Risk detail aggregates linked incidents, RCA state, and action-plan status without duplicating RCA or action data models.
7. Executive sees hospital risk aggregates only through `/executive/risks`.

## 3. RBAC and Security Review

- Reporter:
  - No menu.
  - No route access.
  - No API access.
- UnitManager:
  - Can view own unit risks in detail.
  - Can view hospital risks in aggregate-only mode.
  - Can create unit proposals only.
  - Can edit only own unit `PROPOSED` risks.
  - Can link only own-unit incidents to own unit `PROPOSED` or `ACTIVE` risks.
- RMTeam/Admin:
  - Full risk visibility.
  - Full create/edit/link/review/approve/reject/merge/close/accept capability.
- Executive:
  - Hospital scope only.
  - Aggregate-only view.
  - No incident detail, no RCA narrative, no action narrative.

## 4. PDPA-Sensitive Data Exposure Review

- Executive and aggregate-only UnitManager risk views do not receive linked incident rows or RCA narrative.
- Risk detail aggregate mode redacts linked incidents entirely and removes review summary text.
- Audit logging redacts `decisionNote`, `acceptedReason`, `summary`, and `note`.
- Existing incident-sensitive APIs and reporter masking were left intact.

## 5. Regression Risks Checked

- Existing incident/RCA/action/export/dashboard routes still build successfully.
- Existing unit tests still pass after introducing risk models and routes.
- `next build` succeeds with the new routes and pages registered. `npm run build` can still hit a stale `.next\export` cleanup blocker on this Windows workspace, which is environmental rather than a TypeScript or route regression.
- Existing incident detail flows still render, with risk integration added outside the original component to avoid rewriting sensitive incident logic.

## 6. Known Limitations

- RM suggestion clustering is intentionally rule-based and limited to recent incident clustering, not deeper trend analytics.
- Risk list pagination is application-layer pagination over the serialized result set. It is acceptable for current scale but should move deeper into the data query if risk volume grows materially.
- Executive trend view is still a lightweight snapshot card layout, not a full charting or time-series analytics surface.
- Some labels in existing legacy files remain mixed-language because the repo already contains older localized strings.

## 7. Recommended Next Improvements

- Add end-to-end browser QA around approval, merge, and incident-link workflows.
- Move risk pagination and aggregate card counting closer to the database query path when the dataset becomes large.
- Expand executive trend visualization from snapshot cards into charted trend lines or committee-ready heatmaps.

## 8. Manual QA Checklist

- Log in as Reporter and verify no Risk Register menu and no `/api/risks` access.
- Log in as UnitManager and verify:
  - own unit risk proposal can be created
  - hospital risk cannot be created directly
  - own unit proposal is editable
  - hospital risk view is aggregate-only
- Log in as RM/Admin and verify:
  - hospital risk can be created
  - proposal can be approved, rejected, and merged
  - linked incidents appear in detail
  - reviews update residual score and next review
- Log in as Executive and verify:
  - `/executive/risks` loads
  - incident narratives and RCA narrative are absent
  - no detail editing controls appear
- Open unit dashboard and confirm the new risk widget cards render.
- Open incident detail from RM and Unit flows and verify related-risk linking/create controls appear without breaking existing RCA/action behavior.
