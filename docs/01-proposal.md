# App Proposal

## App Name
**Dentiprice** — A Dental Treatment Pricing and Appointment Management System

## Overview
Dentiprice helps dental patients estimate the cost of dental treatments and submit an appointment inquiry, while allowing clinic staff to manage patients, treatments, inquiries, and appointments in one system.

## Target Audience & User Goals

### 1. Dental Patients
* **Target Audience:** Individuals seeking dental care who want transparency regarding procedure costs and an easy way to schedule visits.
* **User Goal:** When patients open the app, they are trying to find a treatment, understand its estimated price, select any relevant add-ons, and submit their preferred appointment details.

### 2. Dental Clinic Staff
* **Target Audience:** Clinic administrators, receptionists, and dental staff responsible for operations and patient care.
* **User Goal:** When clinic staff open the admin system, they are trying to review patient inquiries, manage appointments, update treatment information, and view patient records.

---

## Sections and Routes

The route names below describe the current implementation as of October 5, 2026. The public estimator and inquiry form are sections on the home page, not separate routes.

| # | Section / Route | What It Is For |
|---|---|---|
| **1** | **Home (`/`)** | Introduces DentiPrice and includes the public procedure catalog, price estimator, and consultation inquiry form. |
| **2** | **Admin Login (`/admin/login`)** | Lets an administrator sign in through Supabase Authentication. |
| **3** | **Admin Dashboard (`/admin`)** | Shows clinic activity and links to the administration modules. |
| **4** | **Inquiries (`/admin/inquiries`)** | Lets administrators review and manage consultation inquiries. |
| **5** | **Patients (`/admin/patients`, `/admin/patients/:id`)** | Lets administrators manage patient records and view an individual patient's history. |
| **6** | **Scheduling (`/admin/scheduling`)** | Lets administrators review, schedule, and manage appointments using overview, calendar, and list views. |
| **7** | **Treatments (`/admin/treatments`)** | Lets administrators create and manage procedures and their add-ons. |

There is no separate public estimator or inquiry route, and the current admin routes do not include a clinic-settings page.

---

## State Management

### Primary State Breakdown (Treatments / Price Estimator)
The **Price Estimator** is the core feature of the application. Its state determines the active treatment selection, chosen add-ons, and total computed cost.

| Data | Shape (Rough) | Owner Component | Triggered Changes |
|---|---|---|---|
| **Treatments** | `[{ id, name, price, description, duration }]` | `PriceEstimator` / Treatment components | Treatments are loaded or updated |
| **Selected Treatment** | `{ id, name, price }` | `PriceEstimator` | Patient selects a different treatment |
| **Add-ons** | `[{ id, name, price, procedureId }]` | `PriceEstimator` | Add-ons are loaded |
| **Selected Add-ons** | `[{ id, name, price }]` | `PriceEstimator` | Patient selects or removes an add-on |
| **Total Price** | `number` | `PriceEstimator` | Selected treatment or add-ons change |
| **Inquiry Information** | `{ name, phone, email, date, time }` | `InquiryForm` | Patient enters or updates their information |

---

## Screen Architecture

### Screen Detail: Treatments / Price Estimator
* **Block 1:** Page Heading and Introduction
* **Block 2:** Treatment Selection (List / Cards)
* **Block 3:** Treatment Details & Base Price
* **Block 4:** Available Add-ons
* **Block 5:** Selected Treatment & Add-on Summary
* **Block 6:** Total Estimated Price Display
* **Block 7:** "Continue to Appointment Inquiry" Action Button

> *These blocks are implemented with reusable React components, including `ProcedureCard`, `PriceEstimator`, `InquiryForm`, and shared UI components.*

---

## Content & Assets Needed

* **Treatment Information:** Dental treatment names, descriptions, base prices, and estimated procedure durations.
* **Add-on Options:** Available treatment add-ons, pricing details, and descriptions.
* **Clinic Details:** Clinic name, contact information, operating hours, and location.
* **Visual Assets:** Treatment/add-on icons, imagery, and Dentiprice logo/branding assets.
* **Form & Schedule Data:** Patient inquiry form field definitions and available appointment time-slot configurations.

---

## Key Risk & Mitigation

* **Identified Risk:** Maintaining data consistency and integrity across connected entities (Patients, Inquiries, Appointments, and Records). For instance, updating an appointment relies on linked inquiry data and existing patient history.
* **Mitigation Strategy:** 
1. Decouple data operations into isolated, well-defined service layers API/service files.
2. Implement strongly-typed data interfaces and relational models.
3. Encapsulate UI elements into reusable, modular React components to ensure predictable unidirectional data flow.