# Design System

The **DentiPrice Design System** defines the visual rules and reusable interface components used throughout the application. Its purpose is to keep the patient-facing pages and admin panel visually consistent.

## Visual Design Reference

The implemented design tokens are defined in `src/index.css` and used through Tailwind CSS v4 utilities. A separate exported design-system image is not included in the repository.

---

## Colour

DentiPrice uses a small, consistent color palette rather than different colors for each page.

| Token | Role | Hex |
|---|---|---|
| `--color-primary` | Brand color and primary buttons | `#5C1428` |
| `--color-primary-hover` | Hover and active states | `#8A1E3C` |
| `--color-accent` | Selected states and focus rings | `#B82850` |
| `--color-cta` | Patient-facing calls to action | `#D64070` |
| `--color-ink` | Main text | `#2E0A14` |
| `--color-bg` | Main page background | `#F8FAFC` |
| `--color-surface` | Cards, panels and modals | `#FFFFFF` |
| `--color-border` | Card, form and table borders | `#E2E8F0` |
| `--color-sidebar` | Admin navigation background | `#4A0F1F` |

### Semantic colors

| Token | Role | Hex |
|---|---|---|
| `--color-success` | Successful and completed states | `#15803D` |
| `--color-warning` | Warnings and pending states | `#B45309` |
| `--color-error` | Errors and destructive actions | `#B91C1C` |
| `--color-info` | Informational states | `#0369A1` |

The stylesheet labels the semantic status colors “WCAG AA”; this repository does not include a separate contrast-audit report, so that label is not evidence that every text/background combination has been measured.

---

## Typography

DentiPrice's stylesheet sets this preferred font stack:

```css
--font-sans: Inter, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Inter is preferred when available; system sans-serif fonts are fallbacks. The project does not define custom font-size tokens; text sizing uses Tailwind utility classes.

## Shape, spacing and focus

The stylesheet defines a `12px` card radius, an `8px` control radius, a pill radius, and a subtle card shadow. Layout spacing and most component styles use Tailwind utility classes.

Interactive elements receive a visible default focus outline through `:focus-visible` (2px solid accent with a 2px offset). This is one accessibility-related implementation detail, not a complete accessibility audit.