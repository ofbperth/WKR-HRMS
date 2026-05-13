# Dashboard and Reporting

## Dashboard Pages

| Page | Purpose |
| --- | --- |
| `/unit/dashboard` | Unit-scoped summary for current UnitManager unit. |
| `/rm/dashboard` | RM operational dashboard across all incidents. |
| `/rm/analytics` | RM analytics alias. |
| `/rm/heatmap` | Unit x severity heatmap. |
| `/rm/analysis` | Risk trend and category analysis. |
| `/rm/safety-goals` | 9 Important Safety Goals for RM. |
| `/executive/dashboard` | Aggregate executive analytics. |
| `/executive/safety-goals` | Executive safety-goal view. |
| `/executive/monthly-report` | Executive monthly report. |
| `/admin/dashboard` | Admin dashboard. |
| `/admin/governance` | Admin-only governance dashboard. |

## Key Metrics

Dashboard and analytics areas cover:

- Incident counts.
- Severity distribution.
- Status distribution.
- Clinical/General split.
- SIMPLE category.
- Unit-level trends.
- Top risk codes.
- Top units.
- Open/closed filtering.
- Safety-goal counts.
- RCA/action workflow status.

## Filters

Dashboard and analytics APIs support documented filters:

- `startDate`
- `endDate`
- `unitId`
- `clinicalOrGeneral`
- `simpleCategory`
- `includeClosed`

UI date presets include this month, Thai fiscal year, last 12 months, and custom date range.

## Heatmap Concept

The heatmap summarizes incident counts by unit and severity/category so RM can quickly identify concentrated operational risk.

UnitManager views must remain unit-scoped. Executive views must remain aggregate-only and avoid sensitive fields.

## Monthly Report Concept

RM/Admin can generate a monthly report from RM reporting surfaces. Executive monthly report pages show printable summaries with sensitive details minimized.

Monthly report records are stored in `MonthlyReport` with year, month, generated timestamp, summary JSON, and optional file URL.

## Exports

Export areas include incident, RCA, action, and audit CSVs where role-authorized.

Security expectations:

- Same role scope as UI/API list views.
- Signed/limited access for downloads where configured.
- Export actions should write audit logs.
- Executive/non-sensitive exports should mask patient identifiers.

## Automation / Notification Notes

Known automation jobs:

- Overdue action check: daily 07:00 recommendation.
- Due-soon notification: daily 07:10 recommendation.
- Status sync: hourly recommendation.
- Notification cleanup: weekly recommendation.
- Retention cleanup: dry-run first.

LINE notification is not implemented in the reviewed docs. Treat it as TBD/future only if stakeholders request it.

