# Role Guide

## Reporter

- Submit incidents at `/report/new`.
- View own incidents at `/my-reports`.
- Update own incident only while status is `New`.
- Cannot access RM, Unit, Executive, or Admin pages.

## UnitManager

- View unit dashboard, incidents, RCA, and actions for own unit only.
- Submit RCA for incidents in own unit.
- Create action plans after RCA approval.
- Export unit-scoped RCA and action data.

## RMTeam

- View all RM workflow pages.
- Triage incidents.
- Request and approve RCA.
- Verify action plans.
- Close incidents after actions are verified.
- Export incident, RCA, and action CSV.
- Run RM automation jobs.

## Executive

- View executive dashboard and safety goals.
- View monthly report with sensitive details masked.
- Cannot access detailed RM workflow or admin tools.

## Admin

- Has RMTeam-level workflow authority plus system administration.
- Manage users, roles, units, risk codes, Google auth settings, audit logs, and automation.
- Can deactivate users and unlink Google accounts.
- Must not use Admin as a routine clinical workflow account unless operationally required.
