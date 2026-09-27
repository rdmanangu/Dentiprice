# Mockup

This document contains the visual mockups for **DentiPrice**, my dental pricing and appointment inquiry system.

The mockups are based on the approved project proposal and the completed wireframes. They show how the application is intended to look using the project's actual colors, typography, spacing, content, and interface components.

## Mockup Screens

The mockups cover the main patient and admin screens included in the revised project plan.

### Patient Side

| Screen | Mockup |
|---|---|
| Home | [View Home Mockup](assets/home-mockup.png) |
| Price Estimator | [View Price Estimator Mockup](assets/price-estimator-mockup.png) |
| Inquiry Form | [View Inquiry Form Mockup](assets/inquiry-form-mockup.png) |

### Admin Side

| Screen | Mockup |
|---|---|
| Admin Dashboard | [View Dashboard Mockup](assets/admin-dashboard-mockup.png) |
| Inquiries | [View Inquiries Mockup](assets/inquiries-mockup.png) |
| Patients | [View Patients Mockup](assets/patients-mockup.png) |
| Appointments | [View Appointments Mockup](assets/appointments-mockup.png) |
| Schedule | [View Schedule Mockup](assets/schedule-mockup.png) |
| Treatments & Add-ons | [View Treatments & Add-ons Mockup](assets/treatments-addons-mockup.png) |

## Empty State

At least one empty state is included in the mockups to show how the application behaves when there is no data to display.

For example, the admin inquiry page can display an empty state when there are no patient inquiries:

![Empty Inquiries State](assets/inquiries-empty-state.png)

The empty state provides a clear message instead of leaving the page blank.

## Responsive Mockups

The mockups also show how the application changes on smaller screens.

### Desktop

The desktop layouts use the full available screen width and provide space for the admin navigation, tables, cards, forms, and other content.

### Phone

The phone layouts reorganize the content into a smaller vertical layout. Tables and multi-column sections can stack or become horizontally scrollable where necessary, while navigation is adapted for the smaller screen.

![DentiPrice Mobile Mockup](assets/mobile-mockup.png)

## Design Decisions

The mockups use the DentiPrice design system defined in [`03-design-system.md`](03-design-system.md).

The same design decisions are applied throughout the application:

- Consistent primary and accent colors
- Consistent heading and body typography
- Consistent spacing between sections and components
- Reusable buttons, cards, inputs, tables, badges, and navigation
- Clear visual hierarchy between headings, content, actions, and status information
- Responsive layouts for desktop and phone screens

## Real Content

The mockups use DentiPrice-specific content rather than placeholder text such as "Lorem ipsum" or "Title here."

Examples include:

- Dental treatment names
- Treatment prices
- Treatment duration
- Add-on names and prices
- Patient information
- Inquiry information
- Appointment information
- Schedule information
- Admin navigation labels

## Mockup vs. Final Implementation

The mockups represent the intended final appearance of DentiPrice. During implementation, some details may change because of technical limitations, responsive behavior, database requirements, or usability improvements.

If a feature shown in these mockups is not included in the final built application, I will document the change in my weekly journal and explain why the implementation was changed.

## Assets

All exported mockup images are stored in the `assets/` folder so the visual documentation remains available in the project repository.
