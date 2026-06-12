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
- `npm run build` succeeds with the new routes and pages registered.
- Existing incident detail flows still render, with risk integration added outside the original component to avoid rewriting sensitive incident logic.

## 6. Known Limitations

- Risk board filtering is functional but basic. It does not yet offer richer dropdown UX or pagination.
- RM suggestion clustering is intentionally rule-based and limited to recent incident clustering, not deeper trend analytics.
- The unlink action is exposed through API and service layer, but the current detail page focuses more on linking than inline unlink UX.
- Some labels in existing legacy files remain mixed-language because the repo already contains older localized strings.

## 7. Recommended Next Improvements

- Add a dedicated unlink button in risk detail linked-incident cards.
- Add pagination and richer filter components for larger risk volumes.
- Add more granular incident snippets for UnitManager own-unit detail while preserving aggregate-only behavior for hospital risks.
- Add dedicated executive trend visualizations for top hospital risks.
- Add end-to-end browser QA around approval, merge, and incident-link workflows.

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
