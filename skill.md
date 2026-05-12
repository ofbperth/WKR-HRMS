\# SKILL.md — WKR-HRMS Development Operating System

Version: 1.0

Owner: Perth + จ๋อง

Project: WKR-HRMS / Hospital Risk Management System

Priority: Stability > Data Integrity > Workflow Reliability > UX Polish



\---



\# 1. CORE DEVELOPMENT PHILOSOPHY



\## 1.1 Fundamental Mindset



This project is NOT a generic CRUD web app.



It is:

\- Hospital-grade Risk Management System

\- HA-oriented operational platform

\- Patient Safety + Personnel Safety infrastructure

\- Designed for Thai public hospital workflow

\- Must survive real-world operational chaos



Therefore:



> "System reliability สำคัญกว่า feature quantity"



Avoid:

\- Fancy but unstable features

\- AI gimmick

\- Overengineering

\- Premature abstraction

\- Complex architecture without operational value



Prioritize:

\- Stability

\- Auditability

\- Traceability

\- Workflow clarity

\- Human-factor design

\- Low cognitive load

\- Fast incident reporting

\- Minimal clicks



\---



\# 2. USER PREFERENCE PROFILE (PERTH MODE)



\## 2.1 Preferred UX Style



UI must be:

\- Clean

\- Minimal

\- Fast

\- Consultant-style

\- Executive readability

\- No clutter

\- High information density WITHOUT confusion

\- 3-second readability rule



Preferred visual style:

\- White / light background

\- Dark navy typography

\- Strong contrast

\- Red = danger/high severity

\- Green = improvement

\- Blue = neutral/system

\- Orange = workflow/process



Avoid:

\- Cartoon UI

\- Glassmorphism overload

\- Fancy animation

\- Tiny fonts

\- Deep nested menus

\- Confusing icons

\- Decorative dashboard junk



\---



\## 2.2 Preferred System Behavior



Every workflow should:

\- Reduce human error

\- Reduce repeated work

\- Reduce clicks

\- Reduce cognitive burden

\- Force standardization

\- Encourage reporting culture

\- Support HA survey readiness

\- Be operationally realistic



Automation preferred whenever:

\- Repetitive

\- Error-prone

\- Delayed

\- Human-dependent



\---



\# 3. NON-NEGOTIABLE RULES



\## 3.1 NEVER BREAK EXISTING FEATURES



Before ANY modification:

1\. Analyze dependency

2\. Identify affected components

3\. Predict regression risks

4\. Verify route compatibility

5\. Verify RBAC compatibility

6\. Verify database impact

7\. Verify existing workflow still works



Rule:

> "No feature regression allowed"



If uncertain:

\- Create fallback

\- Feature flag

\- Safe migration

\- Backup state



\---



\## 3.2 DATA INTEGRITY RULE



Never:

\- Invent NRLS code

\- Guess severity

\- Auto-map incorrectly

\- Modify official terminology

\- Silently overwrite data



Use ONLY:

\- Official NRLS structure

\- Official SIMPLE/2P safety concepts

\- Official HA terminology



Reference sources:

\- NRLS

\- SIMPLE Thailand 2018

\- SPA Part I

\- SPA Part II

\- Patient Safety Goals

\- Personnel Safety Goals



References:

:contentReference\[oaicite:0]{index=0}

:contentReference\[oaicite:1]{index=1}

:contentReference\[oaicite:2]{index=2}

:contentReference\[oaicite:3]{index=3}



\---



\# 4. ARCHITECTURE PRINCIPLES



\## 4.1 Tech Stack



Frontend:

\- React

\- TypeScript

\- Tailwind

\- shadcn/ui



Backend:

\- Next.js App Router

\- Prisma ORM



Database:

\- SQLite (dev)

\- PostgreSQL (production)



Charts:

\- Recharts ONLY



Validation:

\- Zod



Forms:

\- React Hook Form



\---



\## 4.2 Folder Philosophy



Prefer:

\- Feature-based structure

NOT:

\- Huge generic utils dumping ground



Good:

app/incidents/

app/dashboard/

components/risk/

lib/auth/



Bad:

utils2/

helpers-final-final/

temp-fixed-v3/



\---



\# 5. RISK MANAGEMENT DOMAIN LOGIC



\## 5.1 Incident Classification



System must support:

\- Clinical risk

\- General risk

\- Sentinel event

\- Near miss

\- Adverse event

\- Unsafe condition



Definitions aligned with SPA + SIMPLE.



Reference:

Near Miss definition

:contentReference\[oaicite:4]{index=4}



\---



\## 5.2 Severity



Clinical:

A-I



General:

1-5



High severity:

\- E-I

\- Level 3-5



Must support:

\- Trend analysis

\- Heatmap

\- RCA tracking

\- KPI tracking

\- Sentinel escalation



\---



\## 5.3 Mandatory System Components



Core modules:

\- Incident reporting

\- Incident log

\- Dashboard

\- Search/filter

\- RCA

\- KPI tracking

\- Heatmap

\- Monthly reporting

\- Role-based access

\- Audit log



\---



\# 6. ROLE-BASED ACCESS CONTROL (RBAC)



\## General User

Can:

\- Report incident

\- View own incidents



Cannot:

\- View organization-wide data



\## Unit Manager

Can:

\- View unit incidents

\- Add RCA

\- Follow-up actions



\## RM Team

Can:

\- View all incidents

\- Analyze trends

\- Manage RCA

\- Generate reports



\## Admin

Full system control



IMPORTANT:

Dashboard visibility must NEVER leak sensitive patient data.



\---



\# 7. PDPA + SECURITY PRINCIPLES



Must comply with Thai PDPA.



Sensitive fields:

\- HN

\- AN

\- Reporter name

\- RCA detail



Requirements:

\- Encryption at rest

\- Role-based access

\- Audit logging

\- Session timeout

\- Secure authentication

\- Password hashing

\- No plaintext sensitive data

\- Data minimization



Security concepts aligned with:

Personnel Safety Goals — Information Security



Reference:

:contentReference\[oaicite:5]{index=5}

:contentReference\[oaicite:6]{index=6}



\---



\# 8. HUMAN FACTOR DESIGN PRINCIPLES



System must assume:

\- Users are busy

\- Users are tired

\- Users forget things

\- Users skip instructions

\- Users fear blame culture



Therefore:

\- Default safe choices

\- Minimal typing

\- Smart dropdown

\- Autofilter

\- Required fields only when necessary

\- Progressive disclosure



Example:

If Clinical selected:

→ show ONLY clinical NRLS codes



\---



\# 9. DASHBOARD DESIGN RULES



Dashboard must answer:

1\. What is happening?

2\. What is worsening?

3\. What is severe?

4\. Where should leadership act?



Avoid:

\- Decorative metrics

\- Vanity KPIs

\- Tiny unreadable charts



Preferred:

\- Trend lines

\- Heatmaps

\- Top risk ranking

\- Severity distribution

\- RCA completion

\- Unit comparison



\---



\# 10. BUG FIXING OPERATING SYSTEM



\## 10.1 FIRST PRINCIPLE



Do NOT blindly patch bugs.



Always identify:

\- Root cause

\- Scope

\- Regression risk

\- Workflow impact



\---



\## 10.2 DEBUGGING FLOW



\### Step 1 — Reproduce

Can it be reproduced consistently?



\### Step 2 — Isolate

Frontend?

Backend?

Database?

Permission?

API?

State issue?



\### Step 3 — Inspect

Check:

\- Browser console

\- Network tab

\- Terminal logs

\- Prisma logs

\- Next.js logs



\### Step 4 — Verify Data

Check:

\- Schema

\- Migration

\- Null values

\- Enum mismatch

\- Missing relation



\### Step 5 — Fix Minimally

Smallest safe fix first.



\### Step 6 — Regression Test

Re-test:

\- Original feature

\- Related feature

\- Role-based access

\- Navigation

\- Form submission



\---



\# 11. KNOWN PROJECT BUG PATTERNS



\## 11.1 Dropdown Selection Bug



Symptoms:

\- Dropdown click does nothing

\- NRLS code not selected



Likely causes:

\- Missing controlled state

\- Zod enum mismatch

\- onChange not connected

\- Async state overwrite



Check:

\- React Hook Form Controller

\- Value mapping

\- Option object shape



\---



\## 11.2 Submit Button Freeze



Symptoms:

\- Click submit → no action



Common causes:

\- Promise unresolved

\- Validation silently failing

\- Server action crash

\- Missing await

\- Redirect deadlock



Check:

\- Browser network tab

\- API response

\- Form validation

\- try/catch logging



\---



\## 11.3 Role Permission Dead Routes



Symptoms:

\- Unit manager cannot open pages

\- RM Team button unusable



Common causes:

\- Middleware mismatch

\- RBAC route whitelist issue

\- Session role undefined



Check:

\- Middleware

\- NextAuth session

\- Protected route logic



\---



\## 11.4 Prisma Migration Failure



Symptoms:

\- App compiles but DB broken



Common causes:

\- Schema drift

\- Old SQLite schema

\- Enum mismatch



Fix:

\- Verify migration history

\- Reset dev DB safely

\- Re-run generate/migrate



\---



\## 11.5 Windows EPERM Bug



Symptoms:

\- prisma generate fail

\- next build fail

\- spawn EPERM



Common on:

\- Windows 11

\- OneDrive paths

\- Restricted folders



Fix:

\- Move project outside OneDrive

\- Use local dev folder

\- Run terminal as normal user

\- Clear node\_modules

\- Reinstall dependencies



\---



\# 12. TESTING RULES



Before marking feature complete:

\- Test all roles

\- Test empty states

\- Test invalid input

\- Test mobile layout

\- Test reload persistence

\- Test direct URL access

\- Test RBAC

\- Test DB write/read



\---



\# 13. DEPLOYMENT RULES



Before production:

\- Full regression test

\- Security review

\- Permission audit

\- Workflow audit

\- Failure mode analysis

\- Backup strategy

\- Environment variable audit

\- PDPA audit



\---



\# 14. QUALITY MINDSET



This system should eventually become:

\- HA-ready

\- RCA-ready

\- Executive-ready

\- Surveyor-readable

\- Operationally sustainable WITHOUT founder dependency



Target architecture:

> "Lean High Reliability RM Platform"



\---



\# 15. FINAL DEVELOPMENT PHILOSOPHY



Do not optimize for:

\- Developer ego

\- Fancy architecture

\- Trendy stack



Optimize for:

\- Operational survivability

\- Staff usability

\- Patient safety

\- Leadership visibility

\- Sustainable quality culture



Final rule:

> "If the system makes reporting harder, the system failed."

