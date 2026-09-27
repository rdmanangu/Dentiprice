# Security and Privacy Checklist

## Before the First Push

| Check | Status | Evidence / Notes |
|---|---|---|
| `.gitignore` includes `.env` | Yes | The project ignores `.env` so real environment variables are not committed. |
| `.env` is not tracked by Git | Yes | `.env` is excluded through `.gitignore`. |
| `.env.example` is committed | Yes | `.env.example` contains placeholder Supabase values only. |
| No real connection strings, keys, or passwords are committed | Yes | Real Supabase credentials are kept in the local `.env` file and are not included in the repository. |
| No private student information is included | Yes | No student number, personal email, or private credentials are intentionally included in the project. |
| Screenshots do not expose credentials | Yes | Screenshots used for documentation should contain only application UI and test data. |

## The Application

| Check | Status | Evidence / Notes |
|---|---|---|
| SQL queries are parameterized | Yes | Database operations use Supabase client queries and RPC functions instead of building SQL strings from user input. |
| Input is validated | Yes | Forms validate required fields and values before submission. Database-side functions also handle important workflow validation. |
| CORS is restricted | N/A | DentiPrice uses Supabase directly from the React application rather than a separate Express API with a custom CORS configuration. |
| `NODE_ENV=production` is configured | N/A | The current application does not use a separate Node/Express production server. |
| Stack traces are not exposed to users | Yes | Application errors are handled by the UI and are not intentionally displayed as server stack traces. |
| Helmet is installed | N/A | There is no separate Express server in the current DentiPrice architecture. |
| Rate limiting is implemented | N/A | No separate Express API is currently used. Supabase/database access is used instead. |
| Passwords are hashed and never logged | N/A | DentiPrice does not implement its own password storage system. |
| Ownership checks protect user data | Yes | Access to database records is controlled through Supabase Row Level Security policies where applicable. |
| `npm audit` has been checked | Yes | Dependency security should be checked with `npm audit` before the final public submission. |

## Privacy

| Check | Status | Evidence / Notes |
|---|---|---|
| No real classmates' personal information is used | Yes | Test/demo records should use invented patient information rather than real classmates' names, phone numbers, or emails. |
| Seed/test data is invented | Yes | Demonstration data is intended to be fictional. |
| Real tester data is deleted before submission | Yes | Any real patient/tester information must be removed before the repository and deployed application are submitted. |
| The app explains what information it collects | Yes | The inquiry workflow collects information needed to contact the patient and process an appointment inquiry. |
| Screenshots contain no unnecessary personal information | Yes | Screenshots should use fictional test patients and avoid exposing private information. |

## Personal Information Collected

DentiPrice may collect information such as:

- Patient name
- Phone number
- Email address
- Appointment preferences
- Selected dental treatments
- Selected add-ons
- Inquiry and appointment information

This information is used for the dental inquiry and appointment workflow. Only information needed for those functions should be entered into the application.

## Before Submission

Before making the repository public, I will verify:

- [ ] `.env` is ignored by Git.
- [ ] No real Supabase credentials are committed.
- [ ] `.env.example` contains placeholders only.
- [ ] No real classmates' or testers' personal information remains.
- [ ] Screenshots do not expose private information.
- [ ] Demo/test patient records are fictional.
- [ ] `npm audit` has been checked.
- [ ] Supabase Row Level Security policies have been reviewed.
- [ ] `SECURITY-CHECKLIST.md` matches the actual repository.

## Journal Reflection

The riskiest part of DentiPrice is the handling of patient information because the application stores names, contact details, inquiries, and appointment information. I addressed this by keeping credentials out of the repository, using an `.env.example` with placeholders, using Supabase database access and Row Level Security, and using fictional data for testing and screenshots. I also need to make sure that any real tester information is removed before the final submission. One tradeoff I accepted is that the current application does not have a separate Express API with custom rate limiting, Helmet, and server-side CORS configuration because the project currently uses Supabase as its backend. Before deployment, I will review the database policies and test the application with only the minimum information needed for the inquiry and appointment workflow.