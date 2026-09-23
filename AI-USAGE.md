# AI Usage

## How I Used AI

I used AI as a development assistant throughout the DentiPrice project. I used it for planning, implementation suggestions, debugging, code review, and documentation. I did not assume that AI-generated code was automatically correct. I tested the suggestions in my project and changed them when they did not work.

### 1. Initial DentiPrice Project

I used AI during the initial development of DentiPrice to help plan the project structure and start building the application.

**What I did:** I used the suggestions as a starting point and tested the application while developing the initial project.

**Commit:** [Initial DentiPrice project](https://github.com/rdmanangu/Dentiprice/commit/eac3a48)

---

### 2. Treatment Catalog and Search

I used AI to help develop the treatment catalog and treatment search features. This included organizing treatment information and making it easier for users to find treatments.

**What I did:** I tested the treatment catalog and search functionality and checked that the displayed treatment information matched the project requirements.

**Commit:** [Build initial Dentiprice treatment catalog](https://github.com/rdmanangu/Dentiprice/commit/d33baf2)

---

### 3. Treatment Filtering and Sorting

I used AI to help with the treatment search filters and sorting functionality.

**What I did:** I tested different treatment searches and checked that filtering and sorting produced the expected results.

**Commit:** [Add treatment search filters and sorting](https://github.com/rdmanangu/Dentiprice/commit/cf873a3)

---

### 4. Procedure and Add-on Pricing

I used AI to help implement the treatment add-on pricing and connect procedure information with the consultation flow.

**What I did:** I tested the pricing calculations and checked that the treatment and add-on information worked correctly together.

**Commit:** [Add real-time procedure add-on pricing](https://github.com/rdmanangu/Dentiprice/commit/75c4808)

---

### 5. Patient Records and Appointment Scheduling

I used AI to help develop the patient records and appointment scheduling foundation. AI helped me understand how patient information and appointment data could be connected.

**What I did:** I tested the patient and appointment workflow and checked that the database records were connected correctly.

**Commit:** [Add patient records and appointment scheduling foundation](https://github.com/rdmanangu/Dentiprice/commit/9bcd18e)

---

### 6. Appointment and Patient Workflow

I used AI to help develop the appointment, scheduling, and patient workflow features on the admin side.

**What I did:** I tested the workflow and checked that the different parts of the admin system worked together.

**Commit:** [Update appointments, scheduling, and add patient workflow features](https://github.com/rdmanangu/Dentiprice/commit/956f109)

---

### 7. Admin Dashboard and Patients UI

I used AI to help improve the patients page and admin dashboard interface.

**What I did:** I reviewed the UI changes and tested the patient information and dashboard features.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)


## Where the AI Got It Wrong

AI-generated code was not always correct. I had to test the suggestions against my actual Supabase database and application. These cases helped me understand that AI output needs to be verified instead of being accepted automatically.

### 1. Patient Statistics Queries

One problem happened while working on the patient statistics queries. An approach using database aggregation and relationships did not work correctly with the relationships in my database.

The Supabase query produced relationship errors. I investigated the error and changed the implementation instead of keeping the original approach.

**What I learned:** A query that looks correct can still fail when it does not match the actual database schema.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)

---

### 2. Supabase Relationship Queries

Another problem happened when querying tables that had multiple foreign-key relationships. The generated query caused a Supabase `PGRST201` relationship error.

I had to identify the actual foreign-key relationships and explicitly specify the correct relationship in the queries.

**What I learned:** I need to understand the relationships in my own database instead of assuming that an AI-generated relationship query will work.

**Commit:** [Update patients and admin dashboard UI](https://github.com/rdmanangu/Dentiprice/commit/8963834)

---

### 3. Inquiry Submission Conflict

The inquiry submission workflow produced a `409 Conflict` error. I used AI to investigate the possible database and RPC causes, but I also had to test the application and inspect the actual database behavior.

I used the error information to investigate the problem instead of assuming the first AI explanation was correct.

**What I learned:** An HTTP error code does not always explain the actual database problem. I need to inspect the underlying error and test the application.

**Commit:** [Fix inquiry submission conflict](https://github.com/rdmanangu/Dentiprice/commit/be9836b)


## Who Wrote What

AI was an important development assistant for DentiPrice, but I remained responsible for deciding what code was used, testing the application, and correcting problems.

### Code I personally worked on

I personally wrote, modified, tested, and/or debugged parts of:

- Patient management functionality.
- Patient statistics logic.
- Patient and appointment workflows.
- Supabase database queries.
- Supabase relationship fixes.
- Inquiry submission and debugging.
- Admin dashboard and patient UI changes.
- Treatment and add-on management.
- Appointment scheduling.
- Form and UI changes.
- Project documentation.

I did not simply accept every AI-generated solution. When the application produced errors, I investigated the errors, tested different solutions, and changed the implementation.

### How I know what my code does

I can explain the main parts of the application that I worked on because I tested them during development.

For example, when patient statistics produced a Supabase relationship error, I investigated the database relationships and changed the implementation instead of leaving the generated query unchanged.

I also learned how patients, inquiries, and appointments are connected and how Supabase relationships affect the queries used by the application.

### My responsibility

I was responsible for:

- Deciding what features DentiPrice needed.
- Testing the application.
- Reading and investigating errors.
- Checking AI suggestions against my database.
- Changing incorrect implementations.
- Deciding which AI-generated code to keep.
- Reviewing the final code.
- Writing and reviewing the project documentation.

AI helped me develop the project faster, but I was responsible for verifying the implementation and making sure the final application worked.

## AI Usage Summary

AI was a major development tool during the DentiPrice project. I used it for implementation ideas, debugging, planning, and documentation.

The most important thing I learned was that AI-generated code cannot simply be trusted without testing. Several database and workflow issues required me to investigate the actual error, understand my database structure, and change the suggested implementation.

Using AI also helped me learn more about Supabase relationships, database queries, patient workflows, appointment scheduling, and debugging.