# Security Checklist

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | I checked `.gitignore` and confirmed that `.env` is ignored. |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `.env.example` contains placeholder configuration values and does not contain real credentials. |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | I checked the project source for sensitive credentials and kept configuration values outside the source code. |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | I searched the Git history for common credential patterns and did not find committed credentials. |
| 5 | Any credential that was ever committed has been rotated | N/A | I did not intentionally commit a real credential, so there was no credential that needed to be rotated. |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | Production credentials are configured through environment settings rather than committed to the repository. |

## GitHub Actions

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | N/A | The project does not currently use workflow YAML files containing application secrets. |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | The current project does not require GitHub Actions secrets for its application configuration. |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | There are no application secrets being printed by a GitHub Actions workflow. |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | Yes | I checked the project files and did not include `.env` or private key files in the application repository. |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | No third-party GitHub Actions are currently used for application functionality. |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | I checked the GitHub repository security settings and enabled the available secret protection features. |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | DentiPrice uses Supabase queries and RPC functions for database operations instead of building SQL from user input with string concatenation. |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | The application communicates with the database through Supabase rather than exposing a direct PostgreSQL connection to the browser. |
| 15 | The database user the app connects as has only the permissions it needs | Yes | Database access is controlled through Supabase configuration and database policies rather than exposing unrestricted database credentials to the client. |
| 16 | Seed and sample data is invented, not real people's data | Yes | Patient and appointment data used for development and demonstrations is fictional sample data. |
| 17 | Debug, seed and reset routes are removed before going public | N/A | DentiPrice does not expose public debug, seed, or database-reset routes. |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | The DentiPrice admin area has an admin access/login mechanism to restrict administrative functionality. |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | Yes | DentiPrice uses Supabase and its database access is protected using Supabase security policies. |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace `project/README.md` | N/A | DentiPrice does not use the specific Zero Trust access policy described in this checklist. |
| 21 | The gate covers every route, including the ones that only change data | Yes | Administrative functionality and data-changing actions are restricted to the admin side of the application. |
| 22 | The credentials for the gate are environment variables, not in source | Yes | Sensitive authentication configuration is kept outside the source code and is not committed to the repository. |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | Inquiry and patient information is validated before database operations are performed. |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | User-provided values are rendered through React as text rather than being inserted as raw HTML. |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | Application errors are handled without intentionally exposing database credentials, connection strings, or server file paths. |
| 26 | CORS is not a wildcard on routes that change data | Yes | The application's cross-origin configuration does not intentionally allow unrestricted wildcard origins for data-changing operations. |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | I checked the project content and did not intentionally include personal student information or private contact information. |
| 28 | No classmate's personal data in the repository | Yes | DentiPrice uses fictional patient information for sample and demonstration records. |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | Dependencies are installed through npm and `node_modules` is excluded through `.gitignore`. |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | Project assets are created for the project or used with appropriate permission/licensing. |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | I checked the GitHub repository settings and confirmed that the repository visibility is intentional for the final submission. |

## Anything I found and fixed

While completing this checklist, I reviewed the project's environment variables, database configuration, authentication, and sample patient information. I made sure sensitive credentials are not stored in the repository and that sample data does not represent real patients. I will continue checking the repository and deployment settings before the final public submission.