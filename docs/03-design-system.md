# Design System

The **DentiPrice Design System** defines the visual rules and reusable interface components used throughout the application. Its purpose is to keep the patient-facing pages and admin panel visually consistent.

## Visual Design Reference

The complete visual design system is represented in the exported design-system image stored in the project assets folder.

![DentiPrice Design System](assets/design-system.png)

The visual reference includes the color palette, typography, spacing scale, reusable components, and component states.

---

## Colour

DentiPrice uses a small, consistent color palette rather than different colors for each page.

| Token | Role | Hex |
|---|---|---|
| `--color-primary` | Main buttons, links, active navigation | `#2563EB` |
| `--color-accent` | Highlights and important actions | `#14B8A6` |
| `--color-bg` | Main page background | `#F8FAFC` |
| `--color-surface` | Cards, panels, forms and tables | `#FFFFFF` |
| `--color-text` | Main body and heading text | `#1E293B` |

### Semantic colors

| Token | Role | Hex |
|---|---|---|
| `--color-success` | Successful actions and active states | `#16A34A` |
| `--color-warning` | Warnings and pending states | `#D97706` |
| `--color-error` | Errors and destructive actions | `#DC2626` |
| `--color-muted` | Secondary text and inactive information | `#64748B` |

Text and background combinations are checked for readable contrast. Normal text should meet the WCAG minimum contrast ratio of **4.5:1**.

---

## Typography

DentiPrice uses a simple type scale so that headings, body text, and supporting information remain consistent.

| Token | Size | Weight | Used for |
|---|---:|---|---|
| `--font-size-xl` | `32px` | 700 | Main page headings |
| `--font-size-lg` | `24px` | 700 | Section headings and dashboard titles |
| `--font-size-md` | `16px` | 400–500 | Body text, forms and table content |
| `--font-size-sm` | `14px` | 400–500 | Labels, captions and secondary information |

### Font family

The application uses a clean sans-serif font stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;