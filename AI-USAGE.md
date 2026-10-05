# AI Usage

## How I Used AI

I used AI as a development assistant throughout the DentiPrice project. My main contribution was on the backend, where I worked on Supabase integration, PostgreSQL database logic, authentication, patient and inquiry data handling, appointment workflows, debugging, and production-readiness work. I also made a smaller contribution to the frontend in the React + TypeScript + Vite app, including admin dashboard and patient UI updates, scheduling UI improvements, login and branding changes, component cleanup, logo fixes, and TypeScript prop-type fixes.

AI was especially helpful for explaining unfamiliar code and technical concepts, identifying possible causes of errors, suggesting solutions, supporting implementation and cleanup work, and helping prepare documentation and technical explanations. I did not treat AI output as automatically correct. I verified suggestions against the actual code, database structure, and application behavior before keeping, adapting, or discarding them.

### 1. Initial DentiPrice Project

I used AI during the early development of DentiPrice to help think through the project structure and initial implementation direction.

**What I did:** I used AI as a starting point for planning and implementation ideas, then I tested the results in the actual application and adjusted them as needed.

**Commit:** [Initial DentiPrice project](https://github.com/rdmanangu/Dentiprice/commit/ea3c448)

---

### 2. Treatment Catalog and Search

I used AI to help work through the treatment catalog and treatment search features. This included organizing treatment data and reviewing how the search and display logic could fit into the project.

**What I did:** I was responsible for testing the catalog and search flow and checking that the treatment information displayed correctly in the app. AI helped with suggestions and debugging during the process.

**Commit:** [Build initial Dentiprice treatment catalog](https://github.com/rdmanangu/Dentiprice/commit/d33baf2)

---

### 3. Treatment Filtering and Sorting

I used AI to help with the treatment filtering and sorting logic.

**What I did:** I tested different search combinations and validated that the filtering and sorting results matched the expected behavior. AI supported the troubleshooting and refinement process.

**Commit:** [Add treatment search filters and sorting](https://github.com/rdmanangu/Dentiprice/commit/cf873a3)

---

### 4. Procedure and Add-on Pricing

I used AI to help reason through the procedure add-on pricing logic and how it connected to the consultation flow.

**What I did:** I checked the pricing calculations and verified that the procedure and add-on data worked correctly together. AI helped with possible implementation approaches and debugging when issues came up.

**Commit:** [Add real-time procedure add-on pricing](https://github.com/rdmanangu/Dentiprice/commit/75c4808)

---

### 5. Patient Records and Appointment Scheduling

I used AI to help develop the patient records and appointment scheduling foundation. AI was useful for understanding how patient information and appointment records could be connected in the application and database.

**What I did:** I tested the patient and appointment workflow and checked that the data connections in the project were working correctly. This was part of my backend-focused work, with support from AI as needed.

**Commit:** [Add patient records and appointment scheduling foundation](https://github.com/rdmanangu/Dentiprice/commit/9bcd18e)

---

### 6. Appointment and Patient Workflow

I used AI to help develop the appointment, scheduling, and patient workflow features on the admin side.

**What I did:** I tested the workflow and checked that the different admin features worked together. AI helped me reason through issues and possible fixes as I built and refined the system.

**Commit:** [Update appointments, scheduling, and add patient workflow features](https://github.com/rdmanangu/Dentiprice/commit/956f0f9)

---

### 7. Admin Dashboard and Patients UI

I used AI to help improve the patients page and admin dashboard interface, particularly when reviewing UI logic and component behavior.

**What I did:** I reviewed the interface changes and tested the admin dashboard and patient-related features. Some of this work involved frontend improvements, while the underlying data logic was still part of my broader backend contribution.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)

---

### 8. Recent Admin and Scheduling Refinements

The later repository history includes more admin and scheduling work:

- Patient and dashboard UI updates ([commit](https://github.com/rdmanangu/Dentiprice/commit/8dfe186)).
- Scheduling and appointment-management UI changes ([commit](https://github.com/rdmanangu/Dentiprice/commit/cfbd038)).
- Admin login and branding updates ([commit](https://github.com/rdmanangu/Dentiprice/commit/0bf56bd)).
- A logo image-path fix ([commit](https://github.com/rdmanangu/Dentiprice/commit/628a7b1)).
- Scheduling dashboard prop-type fixes ([commit](https://github.com/rdmanangu/Dentiprice/commit/fe3210d)).
- Production-readiness changes across admin components, services, and database migrations ([commit](https://github.com/rdmanangu/Dentiprice/commit/48347ff)).

My contribution in this period was smaller on the frontend than on the backend. These commit links document repository changes; Git history alone cannot show how much of each change was AI-generated or establish that every line was written by me.

## Where the AI Got It Wrong

AI-generated code was not always correct, especially when working with Supabase relationships, database queries, and workflow logic. I had to test the suggestions against the actual project structure and database behavior before accepting them.

### 1. Patient Statistics Queries

One issue happened while working on patient statistics queries. An initial approach using database aggregation and relationship logic did not fit the actual relationships in the project database.

The Supabase query produced relationship errors, and I had to investigate the error and change the implementation instead of keeping the original suggestion.

**What I learned:** A query can look reasonable but still fail if it does not match the actual schema and relationships in the project.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)

---

### 2. Supabase Relationship Queries

Another issue happened when querying tables with multiple foreign-key relationships. The suggested query caused a Supabase `PGRST201` relationship error.

I had to identify the actual relationships in the database and explicitly define the correct query structure rather than assuming the generated relationship logic would work.

**What I learned:** I need to understand the real database structure instead of assuming that an AI-generated query is valid.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)

---

### 3. Inquiry Submission Conflict

The inquiry submission workflow produced a `409 Conflict` error. AI helped me investigate possible causes related to the database and RPC flow, but I also had to test the application and inspect the actual runtime behavior.

I used the information from the error to investigate the underlying issue instead of assuming the first explanation was correct.

**What I learned:** An HTTP error code does not always explain the actual database problem. I need to inspect the root cause and test the application carefully.

**Commit:** [Fix inquiry submission conflict](https://github.com/rdmanangu/Dentiprice/commit/be9836b)


## Who Wrote What

AI was an important development assistant for DentiPrice. My primary contribution was backend development, with a smaller contribution to the frontend. I remained responsible for deciding what code to use, checking suggestions, and correcting problems. This describes my own account of the work; the repository does not independently verify how much of the code was AI-assisted.

### My primary contribution: backend work

My main area of contribution was backend development, including work on:

- Supabase integration and database setup.
- PostgreSQL/Supabase queries and data retrieval logic.
- Authentication and admin access handling.
- Patient, inquiry, and appointment data handling.
- Inquiry workflows and backend troubleshooting.
- Appointment management and scheduling logic.
- Problem solving around Supabase relationship issues and runtime errors.
- Production-readiness work such as code cleanup, validation, and security-focused improvements.

The repository history includes changes to patient and appointment foundations, inquiry handling, scheduling, and production-readiness work ([patient and appointment foundation](https://github.com/rdmanangu/Dentiprice/commit/9bcd18e), [appointment and patient workflows](https://github.com/rdmanangu/Dentiprice/commit/956f0f9), [inquiry conflict fix](https://github.com/rdmanangu/Dentiprice/commit/be9836b), [production-readiness hardening](https://github.com/rdmanangu/Dentiprice/commit/48347ff)). These links show the changes in the repository, not who authored each line or the level of AI assistance.

### My smaller contribution: frontend work

I also made a smaller contribution to the frontend in the React + TypeScript + Vite app, including:

- Admin dashboard and patient UI updates.
- Scheduling UI improvements and appointment-management refinements.
- Admin login and branding updates.
- Component cleanup and visual consistency work.
- Fixes for logo image paths and TypeScript prop-type issues.
- Connecting frontend pages to backend services and refining user-facing behavior.

The repository includes related UI changes ([patient and dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8dfe186), [scheduling UI](https://github.com/rdmanangu/Dentiprice/commit/cfbd038), [admin login and branding](https://github.com/rdmanangu/Dentiprice/commit/0bf56bd), [logo path](https://github.com/rdmanangu/Dentiprice/commit/628a7b1), and [scheduling prop types](https://github.com/rdmanangu/Dentiprice/commit/fe3210d)).

### Documentation contribution

I also contributed to project documentation and supporting project materials, including:

- README updates and live app URL updates.
- Final project documentation.
- Security checklist work.
- AI usage documentation for the project.

These contributions are supported by the git history and repository documentation updates.

### What AI contributed

AI helped with:

- Explaining code and project logic.
- Suggesting possible implementation approaches.
- Helping with debugging and error analysis.
- Improving code structure and readability.
- Supporting implementation, cleanup, and documentation tasks when I needed a second perspective.
- Assisting with understanding unfamiliar Supabase, TypeScript, and React concepts.

I did not simply accept every AI-generated suggestion. When the app produced errors, I investigated the underlying issue, checked the actual project structure and database behavior, and adjusted the implementation based on evidence. I reviewed the final code before keeping it.

### How I know what I implemented

I can explain the main parts of the project that I worked on because I tested them during development. For example, when patient statistics or Supabase relationship queries produced errors, I investigated the database and adjusted the implementation rather than leaving the generated query unchanged.

This project included both backend logic and frontend behavior, and I was responsible for verifying the parts of the app I worked on while using AI as a support tool rather than as the final authority.

### My responsibility

I was responsible for:

- Deciding what the project needed.
- Building and testing the backend features I worked on.
- Checking AI suggestions against the actual project and database setup.
- Investigating errors and correcting incorrect implementations.
- Reviewing the final code and project documentation.
- Making sure the application worked in a realistic way.

AI helped me develop the project faster, but I was ultimately responsible for verifying the implementation and deciding what final code to keep.

## AI Usage Summary

AI was a useful development tool during the DentiPrice project. My main contribution was on the backend, with added frontend work in a React + TypeScript + Vite application. I used AI for implementation ideas, debugging, troubleshooting, code review, and documentation support.

The most important lesson was that AI-generated code cannot be trusted automatically. Several backend issues, especially around Supabase relationships, database queries, and inquiry workflows, required me to investigate the actual project behavior and fix the implementation based on real evidence.

This means AI was a helpful assistant, but the final responsibility for correctness, verification, and project decisions remained with me.