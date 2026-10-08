# DentiPrice — Final Demo Video Script

**Target length:** 4–4:30 minutes
**Recording:** Screen recording + my own voice
**Website:** Deployed DentiPrice application

---

## 0:00–0:30 — Introduction

**Show:** Open the deployed DentiPrice website.

**Say:**

> Hi, I'm Redenelle Maurice Manangu, and this is DentiPrice, a dental pricing and appointment inquiry system.
>
> DentiPrice is designed to help patients understand estimated treatment costs and submit appointment inquiries, while giving authorized clinic staff an admin dashboard to manage patients, inquiries, appointments, treatments, and add-ons.
>
> I'll quickly demonstrate the main patient-to-admin workflow and then show one technical part of the project that I'm particularly proud of.

---

## 0:30–2:45 — Main Application Walkthrough

### 0:30–1:15 — Patient Price Estimator

**Show:** The treatment/pricing estimator.

**Say:**

> I'll start from the patient side.
>
> The patient can select a dental treatment and any applicable add-ons. DentiPrice then calculates an estimated price based on the selected options.
>
> This gives patients a clearer idea of potential costs before they contact the clinic.
>
> The goal here isn't to replace a professional dental assessment. It's to provide a useful estimate and make the inquiry process easier.

**Action:**

* Select a treatment.
* Select an add-on if available.
* Show the calculated estimate.
* Avoid spending too long clicking through options.

---

### 1:15–1:50 — Appointment Inquiry

**Show:** Inquiry form.

**Say:**

> After reviewing the estimate, the patient can submit an inquiry.
>
> The form collects the information needed by the clinic to follow up with the patient.
>
> Once the inquiry is submitted, DentiPrice provides confirmation so the patient knows that the request was received.
>
> An important distinction is that submitting an inquiry does not automatically mean the appointment is confirmed. The clinic staff still needs to manage the request from the admin side.

**Action:**

* Use prepared fictional/demo data.
* Submit the inquiry.
* Show the confirmation screen.

---

### 1:50–2:45 — Admin Dashboard

**Show:** Admin login → dashboard.

**Say:**

> Now I'll switch to the admin side.
>
> The admin dashboard gives authorized clinic staff a central place to manage the information coming from the patient side.
>
> From here, staff can view dashboard information, patients, inquiries, appointments, treatments, and add-ons.
>
> For example, the scheduling area allows staff to manage appointment information and review upcoming appointments.
>
> The treatments and add-ons section also allows the clinic's pricing information to be managed without changing the patient-facing workflow manually.

**Action:**

* Open dashboard.
* Briefly show Patients.
* Show Inquiries.
* Show Scheduling/Appointments.
* Show Treatments & Add-ons.
* Don't click every button; keep the walkthrough moving.

---

# 2:45–3:30 — Technical Feature I'm Proud Of

**Show:** Open **one relevant source file** in your code editor.

**Recommended:** A scheduling/workflow/service file that you personally understand well.

**Say:**

> One technical part I'm proud of is how I worked on the backend and data workflow.
>
> DentiPrice uses Supabase for authentication and PostgreSQL data, with the frontend communicating with the Supabase services.
>
> One thing I had to pay attention to was keeping the workflow consistent between inquiries, patients, and appointments.
>
> I also worked on scheduling-related improvements and TypeScript issues in the admin dashboard. For example, I fixed a scheduling dashboard prop mismatch so the component interface matched how the page was actually using it.
>
> This was useful because it showed me how a seemingly small TypeScript error can come from different parts of the application needing to agree on the same data and component structure.

**Important:**

Only explain code you actually understand. Don't read the entire file. Point to **one function, interface, query, or workflow** and explain what it does.

---

# 3:30–4:00 — Honest Reflection

**Show:** Return briefly to the deployed application.

**Say:**

> If I were to continue developing DentiPrice, one thing I would improve is the overall workflow and user experience even further.
>
> I would also spend more time testing different real-world clinic scenarios and improving the system based on that feedback.
>
> Working on this project taught me a lot about connecting a frontend application with a database-backed system, handling authentication and workflows, and debugging issues across different parts of a project.

---

# 4:00–4:10 — Closing

**Say:**

> Overall, DentiPrice gave me experience building a full application with both patient-facing and admin functionality.
>
> Thank you for watching my DentiPrice demo.

---

# Recording Checklist

Before recording:

* [✓] Use the **deployed URL**, not localhost.
* [✓] Open the website a few minutes before recording.
* [✓] Make sure the app is awake and working.
* [✓] Prepare fictional/demo patient data beforehand.
* [✓] Make sure there are already records in the admin dashboard.
* [✓] Test the estimator.
* [✓] Test the inquiry submission.
* [✓] Test admin login.
* [✓] Check Patients.
* [✓] Check Inquiries.
* [✓] Check Scheduling/Appointments.
* [✓] Check Treatments & Add-ons.
* [✓] Prepare the source file you will explain.
* [✓] Close unrelated browser tabs.
* [✓] Make sure no `.env` file or credentials are visible.
* [✓] Make sure no real patient information is visible.
* [✓] Make sure no private messages or personal information appear.
* [✓] Record with your **own voice**.
* [✓] Keep the video between **3 and 5 minutes**.

## Final Presentation

- **Video:** https://drive.google.com/file/d/19UyjqHshRitB5XWvFzxs3tRU2H3nTayW/view?usp=drive_link
- **Slides:** https://docs.google.com/presentation/d/18vAWir6xbZcT3tFdDblDrMCyUFzhCLWE/edit?usp=drive_link&ouid=109011297119006716577&rtpof=true&sd=true
- **Square image:** https://drive.google.com/file/d/1lMf6p7oQXyys2ctk7X0GnGKdbV9_7Gwc/view?usp=drive_link
