# Security and Privacy Checklist

## Repository Review (October 5, 2026)

This checklist separates controls visible in the repository from checks that require access to the deployed Supabase project, hosting account, GitHub settings, or real demonstration data. Reviewing the source does not by itself establish that deployment settings or live data are secure.

## Configuration and Secrets

| Check | Status | Evidence / Notes |
|---|---|---|
| `.env`, `.env.local`, and `.env.*.local` are ignored by Git | Verified in repository | These patterns are present in `.gitignore`; `.env` and `.env.local` are not tracked. |
| `.env.example` contains placeholders | Verified in repository | It contains a placeholder Supabase URL and publishable key. |
| The browser client uses a service-role key | No | `src/lib/supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. A publishable key is not a secret and must rely on database access policies for protection. |
| Git history was scanned for credentials and any exposed credentials were rotated | Verify before submission | This documentation review did not perform a full secret scan or credential-rotation check. |
| Production environment settings and GitHub secret-protection settings were checked | Verify before submission | These external settings are not available from the checked-in source. |

## Application Access and Data Protection

| Check | Status | Evidence / Notes |
|---|---|---|
| Admin routes require an administrator session | Implemented | The admin route checks for a signed-in user with `app_metadata.role === "admin"`; the admin area is under `/admin`. |
| Database policies protect administrative records | Partially verified | The tracked patient and appointment migrations enable RLS and define admin-role policies. The base schema and its policies are not included in this repository, so review all deployed tables and policies directly. |
| Public inquiry submission is controlled | Implemented in tracked migration | The patient-foundation migration exposes `create_inquiry_with_items` to anonymous callers and revokes direct anonymous table access for that workflow. Review the deployed function and policy configuration before using real data. |
| Confirm-and-schedule is authorized and atomic | Implemented in tracked migration | `confirm_inquiry_and_schedule` checks the admin role and creates the appointment/items while updating the inquiry in one transaction. |
| Appointment workflow integrity is enforced in PostgreSQL | Implemented in tracked migration | Status-transition triggers and a partial unique index prevent invalid transitions and more than one linked appointment per inquiry. |
| All inputs are validated in both the browser and database | Partially verified | The inquiry form validates required fields and dates. The tracked inquiry and scheduling functions enforce key workflow rules; this review did not verify every input path or the untracked base schema. |

## Application Architecture

| Check | Status | Evidence / Notes |
|---|---|---|
| Custom Express API CORS configuration | Not applicable | The repository has a React/Vite frontend that uses Supabase directly; no separate Express API is present. Supabase project-level origin settings still need to be checked in the dashboard. |
| `NODE_ENV=production` for a Node server | Not applicable | The repository builds a Vite frontend and does not include a separate Node/Express production server. |
| Helmet headers and application-level API rate limiting | Not present in this app | No Express API is included. Review hosting and Supabase protections separately; do not treat this as evidence that hosted endpoints have no limits. |
| Password storage | Supabase Auth | DentiPrice does not store or hash passwords itself. Authentication is delegated to Supabase Auth. |
| Stack traces are never exposed to users | Verify with runtime testing | The source includes UI error handling, but this review did not test every error path in the deployed application. |

## Personal Information and Demo Data

DentiPrice handles or can store:

- Patient name, phone number, email address, and date of birth
- Administrative patient notes
- Inquiry contact details, preferred date/time, and selected procedures/add-ons
- Appointment date/time, status, notes, and linked patient/inquiry information

The admin mockup images in `src/assets/` contain realistic patient records and account contact details. Their fictional status cannot be established from the repository. Replace or redact those details before publishing or recording with the images.

The repository does not establish what real information is currently in the deployed database, whether demo records are fictional, or what retention/deletion process is used. Confirm those items directly before inviting real patients or submitting a public demo. Collect only information needed for the project workflow and use fictional data for demonstrations.

## Before Submission

- [✓] Scan tracked files and Git history for secrets; rotate any credential that was exposed.
- [✓] Check production environment variables, Supabase project settings, and GitHub security settings.
- [✓] Review RLS and function grants for every deployed table, including the base schema not included in this repository.
- [✓] Test unauthorized and signed-out access against the deployed database.
- [✓] Confirm demo records and screenshots contain no real patient data or private account details; anonymize the admin mockups.
- [✓] Confirm any privacy notice, data-retention, and deletion expectations for the deployed app.
- [✓] Run the project's build/lint checks and a dependency audit; this review did not run them.
- [✓] Verify that the deployed URL works and that the deployment matches the repository.

## Journal Reflection

The main security boundary in this application is Supabase Auth plus PostgreSQL authorization, not a separate Express API. The tracked migrations show admin-role RLS policies, restricted inquiry submission, an administrator-only scheduling function, and database workflow constraints. A complete security conclusion still requires checking the base schema, deployed Supabase policies and function grants, external account settings, dependency status, and the actual demonstration data.
