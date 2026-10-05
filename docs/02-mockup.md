# Mockup

This document contains the visual mockups for **DentiPrice**, my dental pricing and appointment inquiry system.

The mockups are based on the approved project proposal and the completed wireframes. They show how the application is intended to look using the project's actual colors, typography, spacing, content, and interface components.

## Mockup Screens

The mockups cover the main patient and admin screens included in the revised project plan.

### Patient Side

| Screen | Mockup |
|---|---|
| Home | [View Home Mockup](../src/assets/home.png) |
| Price Estimator | [View Price Estimator Mockup](../src/assets/price_estimator.png) |
| Inquiry Form | [View Inquiry Form Mockup](../src/assets/inquiry_form.png) |

### Admin Side

| Screen | Mockup |
|---|---|
| Admin Dashboard | Pending privacy review |
| Inquiries | Pending privacy review |
| Patients | Pending privacy review |
| Appointments / Schedule | Pending privacy review |
| Treatments & Add-ons | Pending privacy review |

The current admin screenshots in `src/assets/` include realistic patient records and account contact details. They are not linked here until those details are confirmed to be fictional or replaced with anonymized screenshots.

## Empty State

The application has empty-state components for pages with no records. An empty-state mockup image is not currently included in this document.

## Responsive Mockups

The mockups also show how the application changes on smaller screens.

### Desktop

The desktop layouts use the full available screen width and provide space for the admin navigation, tables, cards, forms, and other content.

### Phone

The phone layouts reorganize the content into a smaller vertical layout. Tables and multi-column sections can stack or become horizontally scrollable where necessary, while navigation is adapted for the smaller screen.

The mobile mockup image is also pending the privacy review described above.

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

The available exported mockup images are stored in `src/assets/`.