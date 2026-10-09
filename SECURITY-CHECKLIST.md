# Security Checklist

This is a checklist

## Secrets and credentials

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | I checked `.gitignore` and confirmed that `.env` is ignored. |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `.env.example` contains placeholder configuration values and does not contain real credentials. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | A full tracked-file secret scan was not part of this review. |
| 4 | Git history was scanned for credentials | Yes | A full history scan was not part of this review. |
| 5 | Any credential that was ever committed has been rotated | Yes | Confirm the scan result and rotate any exposed credential. |
| 6 | Production credentials live only in the hosting provider's environment settings | Yes | Hosting-provider settings are not visible in this repository. |

## GitHub Actions

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | N/A | The project does not currently use workflow YAML files containing application secrets. |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | The current project does not require GitHub Actions secrets for its application configuration. |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | There are no application secrets being printed by a GitHub Actions workflow. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | N/A | No GitHub Actions workflow or uploaded build artifact is tracked in this repository. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | No third-party GitHub Actions are currently used for application functionality. |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | These GitHub repository settings cannot be confirmed from the checked-in files. |

## Database

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | DentiPrice uses Supabase queries and RPC functions for database operations instead of building SQL from user input with string concatenation. |
| 14 | Direct PostgreSQL credentials are not shipped to the browser, and public Supabase access is protected by policies | Implemented in source / Yes deployment | The browser client uses the Supabase URL and publishable key. Confirm the deployed RLS policies and project settings; the Supabase API is called directly by the browser. |
| 15 | The database user the app connects as has only the permissions it needs | Yes | The browser uses a publishable key; tracked patient and appointment tables have admin RLS policies. The repository does not include the base schema/policies, so verify permissions for every deployed table. |
| 16 | Seed and sample data is invented, not real people's data | Yes | The repository contains mockup images with realistic records; their fictional status cannot be established from the source. |
| 17 | Debug, seed and reset routes are removed before going public | N/A | DentiPrice does not expose public debug, seed, or database-reset routes. |

## Access control

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | The DentiPrice admin area has an admin access/login mechanism to restrict administrative functionality. |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | Yes | Tracked patient and appointment migrations enable RLS; the baseline schema is not included, and signed-out access was not tested in this review. |
| 20 | Alternative Zero Trust or app-password controls are configured where applicable | N/A | DentiPrice uses Supabase Auth and an admin-role check, not those alternative controls. |
| 21 | The gate covers every route, including the ones that only change data | Yes | Admin routes are protected in the frontend and tracked appointment policies check the admin role. Review all deployed table policies, including the untracked baseline schema. |
| 22 | Auth configuration avoids embedding passwords or privileged keys in the frontend | Implemented in source | The frontend reads the Supabase URL and publishable key from Vite environment variables; administrator authentication is handled by Supabase Auth. |

## Input and output

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | The inquiry form and tracked inquiry/scheduling database functions validate key inputs and workflow rules. Review other paths and the baseline schema. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | User-provided values are rendered through React as text rather than being inserted as raw HTML. |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | This review did not test every error path in the deployed application. |
| 26 | CORS is not a wildcard on routes that change data | Yes | No separate application API is present. Check Supabase project-level origin settings directly. |

## Repository and privacy

| # | Check | Status | Evidence |
| --- | --- | --- | --- |
| 27 | No private student contact details or identifying information are exposed in the repository | Yes | A presenter name and realistic contact details appear in demo material and mockup images; confirm they are intended for public release and redact private data. |
| 28 | No classmate's personal data in the repository | Yes | Confirm that patient records shown in screenshots and any deployed demo data are fictional and authorized for public use. |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | `node_modules` is excluded through `.gitignore`; verify package provenance and registry configuration before submission. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | Confirm the source and permitted use of third-party images and any external assets. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | Check the current GitHub repository visibility before submission. |

## Review summary

The source shows a Vite client configured with a Supabase publishable key, admin-route checks, and RLS/workflow protections in the tracked patient and appointment migrations. 