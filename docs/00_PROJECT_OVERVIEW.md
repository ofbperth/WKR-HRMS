# Project Overview

## Purpose

WKR-HRMS is a Hospital Risk Report & Management System for reporting incidents, reviewing risk logs, managing RCA and action plans, tracking dashboards, and supporting RM governance.

The system helps hospital teams capture risk events, route work to the correct role, protect sensitive data, and produce operational and executive summaries.

## Target Users

| User | Main use |
| --- | --- |
| General user / Reporter | Submit incident reports and track own reports. |
| Unit head / UnitManager | Review unit incidents, complete RCA, create action plans, and follow action owner progress. |
| RM team / Admin | Triage all incidents, request/review RCA, verify actions, close incidents, export reports, and review audit/governance data. |
| Executive viewer | View aggregate dashboards, safety-goal trends, and monthly summaries without sensitive incident details. |

## Problems Solved

- Replaces scattered incident reporting with one role-scoped workflow.
- Gives RM a central triage, RCA, action, dashboard, and export surface.
- Keeps UnitManagers focused on incidents and actions for their own unit.
- Provides executive dashboards while minimizing sensitive detail exposure.
- Creates audit trail coverage for critical workflow, auth, export, and governance actions.
- Documents production readiness items for PDPA, retention, signed exports, and PostgreSQL/Supabase hardening.

## Current Scope

- Credential login and optional Google OAuth identity verification.
- Reporter, UnitManager, RMTeam, Executive, and Admin roles.
- Incident creation, list/search/detail, triage, comments, notifications, RCA, action plans, and closure.
- Unit/RM/Executive dashboards, analytics, heatmap, safety goals, and monthly reports.
- Prisma + SQLite local development.
- Production readiness notes for PostgreSQL/Supabase, encryption, signed exports, retention, backup, and governance.

## Future Scope / Need Verification

- Production PostgreSQL cutover must be tested in staging.
- Supabase RLS/storage scripts must be applied and verified in staging before production.
- Browser E2E automation is not configured yet.
- LINE notification integration is a future idea only if product stakeholders confirm it.
- Attachment upload/storage UI is modeled but needs verification before documenting as complete.
- Hospital-specific PDPA and retention policy must be confirmed with governance before go-live.

