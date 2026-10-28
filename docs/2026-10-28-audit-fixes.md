# HRMS audit fixes 1–9

Scope: findings from the 28 October 2026 review. Incident-number generation
(finding 10) is excluded. No data migration or production data repair is included.

## Experiment ledger

| Run | Input / change | Observed result | Conclusion |
| --- | --- | --- | --- |
| Baseline | Execute source handlers with in-memory Prisma substitutes | Action PUT accepted Verified; approved RCA could be rewritten; classification PUT closed RCARequired without RCA; revision request reopened Closed | Missing server workflow checks, not just UI state |
| Baseline | Serialize synthetic create response | Reporter passwordHash survived the sanitizer | Limit the selected user fields and explicitly shape the response |
| Baseline | Unit-A manager requests unit-B analytics | Requested unit-B reached the analytics query | Bind scope from the authenticated user; deny missing unit |
| Baseline | Seed 1,201 matching trend rows | Card total 1,201; trend total 1,200 | Fixed row caps truncate reports |
| Baseline | Toggle includeClosed | Identical query predicates | Filter input was ignored |
| Regression | Handler tests for direct verification, locked RCA, close prerequisites, closed/rejected decisions, response fields, and cache refresh | Denied writes have no persistence side effects; valid transitions still work | API guards preserve ordinary workflow |
| Regression | Manager requests another unit; manager with no unit; Admin requests another unit | Manager stays scoped; missing unit denied; Admin filter preserved | Scope checks do not remove authorized access |
| Regression | Read 0, 1, 500, 1,000 and 1,501 rows; fail a later page | Every row counted once; page errors propagate | Reports no longer silently truncate at old caps |
| Regression | Attempt RCARequired → UnderReview through classification | Rejected | Classification cannot sidestep close prerequisites in two requests |
| Regression | Workflow mutation followed by an error; partial background batch | Cache invalidated after the committed mutation | Failed requests cannot skip refresh of already-written data |
| Final | Full Vitest suite, TypeScript/lint checks and production build | 166 tests passed in 26 files; checks and build passed | Findings 1–9 covered by source changes and regression tests |

## Implementation

- Verification is available only through the RM/Admin verification endpoint.
- Submitted/Approved RCA is read-only until RM requests revision.
- Classification closure uses the same eligibility policy as the close endpoint.
  RCA/action status transitions stay in their dedicated workflow endpoints.
- Closed, rejected and deleted incidents cannot be reopened by RCA decisions.
- Incident creation selects only public reporter fields; serialization uses an allowlist.
- Unit analytics uses the authenticated manager's unit, including fail-closed behavior
  when no unit is assigned.
- Workflow writes invalidate dashboard/search/monthly-summary caches. Background
  overdue-action and lifecycle changes also invalidate after successful mutations.
- Trend, open-RCA and overdue-action queries read all pages using a stable ID cursor.
  The latest-five sentinel list remains intentionally limited.
- Unchecked includeClosed excludes Closed; checked includes it while still excluding
  Rejected and soft-deleted incidents, including safety-goal reports. Dashboard cache
  version is advanced.

Validation uses synthetic data. Live production runtime logs, real-data repair and
concurrent database transaction testing are outside this validation run.
