---
name: prerenta-product-design
description: Design and implement distinctive, production-quality PreRenta interfaces using the established institutional visual identity, a consistent design system, and modular Sass architecture. Use for any UI, UX, styling, responsive, component, or page redesign task in PreRenta.
---

# PreRenta Product Design Skill

## Purpose

Create a coherent, distinctive, production-quality interface for PreRenta, a Spanish income-tax return platform used by taxpayers and professional gestorías.

The product must feel like a carefully art-directed European tax, legal, and professional-services product—not a generic SaaS template and not an AI-generated dashboard.

Use this skill whenever creating, reviewing, or modifying PreRenta UI, UX, components, layouts, styles, or responsive behavior.

> **Project note (2026-10-31, Phase 1):** the implemented palette uses the navy `#20364F` and copper `#986B45` below, with the light neutral "mist" ground (`#F7F8FA`, lines `#E1E6EC`) chosen by the client instead of the warm ivory and warm borders. Tokens live in `src/styles/abstracts/_tokens.scss`; see `src/styles/README.md`.

## 1. Design principles

Apply these principles in order:

1. **Institutional credibility:** The interface should communicate accuracy, discretion, reliability, and professional care appropriate to tax and legal workflows.
2. **Editorial character:** Use considered typography, deliberate composition, asymmetry where useful, strong hierarchy, and generous but purposeful whitespace.
3. **Functional clarity:** Users must immediately understand where they are, what needs attention, what action is available, and what happens next.
4. **Quiet confidence:** Prefer restrained visual decisions over decoration. Avoid visual noise and unnecessary effects.
5. **Consistency:** Every page must feel like part of the same product, even when public, client, gestoría, and admin experiences have different information density.
6. **Accessibility and resilience:** Design for keyboard use, readable contrast, zoom, localization, loading, empty, error, and narrow-screen states.
7. **Real product quality:** Do not stop at a static visual mockup. Preserve and verify real interactions, data, validation, navigation, and responsive behavior.

## 2. Established visual direction

Treat the following as the current visual foundation. Inspect the repository for existing tokens and assets before changing anything. If actual project values differ, identify the discrepancy and preserve established values unless the task explicitly authorizes a system-wide update.

### Core palette

Use semantic tokens rather than scattering raw hex values through components.

```scss
$color-navy: #20364F;
$color-ivory: #F5F4F0;
$color-copper: #986B45;

$color-white: #FFFFFF;
$color-ink: #202A35;
$color-text: #536273;
$color-muted: #748091;
$color-border: #DED9CF;
$color-surface: #FFFFFF;
$color-surface-subtle: #F7F7F5;

$color-success: #28734D;
$color-warning: #98600A;
$color-danger: #A43D36;
$color-info: #315F8A;
```

These are starting tokens, not permission to use every color everywhere. Check contrast for actual text/background combinations. Semantic status colors must be distinguishable without relying on color alone.

### Typography

- Use the existing project serif display face for major editorial headings. Do not replace it with a generic geometric display font.
- Use **IBM Plex Sans** for body copy, navigation, labels, forms, tables, and controls, provided the font is already configured and licensed/available in the project.
- Use serif typography selectively: page titles, major brand statements, and occasional editorial emphasis—not every card heading.
- Prefer a restrained hierarchy. Typical starting scale:
  - Display/page heading: 40–52px desktop, fluidly reduced on mobile.
  - Section heading: 24–32px.
  - Card or subsection heading: 16–20px.
  - Body: 14–16px.
  - Supporting/meta text: 12–13px.
- Define line heights and font weights explicitly. Avoid overly tight line-height, excessive letter spacing, and all-caps labels everywhere.
- Ensure Spanish, English, and Valencian glyphs and accents render correctly. Avoid forced uppercase for long localized text.

### Shape, borders, and elevation

- Prefer crisp, restrained geometry and thin warm-neutral borders.
- Use small or medium radii only where they support interaction or grouping. Do not round every element.
- Avoid stacked cards, excessive pills, heavy shadows, glassmorphism, gradients, and decorative blobs.
- Use elevation sparingly and only to communicate layering or interaction.
- Use separators and background shifts when they communicate structure more elegantly than another card.

### Layout and spacing

- Use a consistent 4px-based spacing scale: 4, 8, 12, 16, 24, 32, 40, 48, 64, 80.
- Establish page-level max-widths and readable text measures.
- Use CSS Grid and Flexbox intentionally. Do not force every page into the same two-column or three-card template.
- Use asymmetry and editorial composition when they improve hierarchy, not as decoration.
- Align content to a deliberate grid. Maintain consistent page gutters across related screens.
- Avoid large empty areas that do not support hierarchy, but do not fill whitespace with unnecessary widgets.

## 3. Anti-template / anti-AI visual rules

Never default to common generated-dashboard patterns.

Avoid:
- A hero with a gradient blob, floating glass card, and oversized generic headline.
- Repeating three equal cards for every section.
- Putting every group of content inside a rounded white card.
- Excessive badges, pills, icon circles, and decorative icons.
- Random accent colors or gradients.
- Large meaningless numbers or metrics added only to make a dashboard look full.
- Generic copy such as “Seamless experience”, “Unlock your potential”, or “Everything in one place” unless it is genuinely product-specific.
- Arbitrary animation, parallax, hover movement, or scroll effects.
- Using icons as decoration when a clear text label is better.
- Copying a reference website literally.

Instead:
- Build hierarchy through typography, spacing, alignment, contrast, and content grouping.
- Use visual elements only when they clarify the task, status, relationship, or brand.
- Make each page composition specific to its purpose.
- Keep the interface calm, precise, and human-authored in appearance.

## 4. Sass architecture — mandatory styling approach

All new styling and any styling substantially refactored by this skill must use modular **SCSS/Sass**.

First inspect the existing stack, build configuration, and styling conventions. Reuse the current Sass setup if present. If Sass is not installed, check whether the project can support it cleanly; do not silently introduce a new dependency or break the build. Report the dependency requirement before adding it if installation or configuration is necessary.

Use the Sass module system:
- Use `@use` and `@forward`.
- Do not introduce new `@import` statements.
- Do not create one enormous stylesheet.
- Do not duplicate design tokens in multiple files.
- Keep component styles scoped to their components where the framework supports it.

Suggested architecture (adapt to the actual project; do not move files unnecessarily):

```text
src/
  styles/
    abstracts/
      _tokens.scss
      _functions.scss
      _mixins.scss
      _index.scss
    base/
      _reset.scss
      _typography.scss
      _global.scss
    layout/
      _container.scss
      _header.scss
      _footer.scss
      _navigation.scss
    components/
      _button.scss
      _form-field.scss
      _badge.scss
      _alert.scss
      _table.scss
    utilities/
      _accessibility.scss
      _helpers.scss
    main.scss
```

Rules:
- `abstracts` contains tokens, functions, and mixins only; it must not emit component CSS.
- `base` contains global element defaults and typography.
- `layout` contains structural page regions.
- `components` contains reusable UI patterns.
- `utilities` contains small, intentional helper classes.
- Use CSS custom properties for runtime theme values and semantic tokens where useful; Sass variables may organize compile-time values.
- Avoid deep selector nesting. Keep nesting to a maximum of 2–3 levels.
- Avoid `!important` except for a documented, unavoidable integration override.
- Avoid styling by fragile DOM structure or generated class names.
- Do not add global selectors that unintentionally affect unrelated pages.
- Prefer component-level styles and explicit variants.
- Keep breakpoints centralized and use mobile-first responsive rules.
- Do not create abstractions for one-off styles unless reuse is likely.

Example module usage:

```scss
// abstracts/_index.scss
@forward "tokens";
@forward "mixins";

// components/_button.scss
@use "../abstracts" as *;

.button {
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 4px;
  font: inherit;
}
```

## 5. Component and interaction standards

Create or refine reusable patterns only when the project needs them. Keep API and naming consistent.

### Buttons
- Clear primary, secondary, text, and destructive variants.
- Minimum practical touch target of 44px where possible.
- Distinct hover, focus-visible, active, disabled, and loading states.
- Never communicate an action by color alone.

### Forms
- Persistent visible labels; placeholders are not labels.
- Consistent field height, spacing, border, error, disabled, and focus states.
- Explain validation errors next to the relevant field.
- Preserve entered values when validation fails.
- Use correct input types and autocomplete attributes.
- Make radio groups, segmented controls, and selects keyboard accessible.
- Avoid custom controls unless they are fully accessible.

### Tables and case management
- Optimize for scanning: meaningful column order, aligned values, concise status labels, readable density.
- Keep row actions discoverable and consistent.
- Make alerts specific and actionable; link to the task or missing information when possible.
- Support narrow screens intentionally (responsive table, controlled horizontal scrolling, or a considered alternate layout).
- Do not add invented metrics or fake operational data.

### Status and alerts
- Use consistent semantic status vocabulary.
- Pair color with text and, where useful, an icon.
- Distinguish informational, warning, error, and success messages.
- Avoid permanent warning banners for temporary development limitations in production UI.

### Cards and panels
- Use a card only when it communicates a distinct grouping, surface, or action.
- Avoid nested cards and repeated card grids.
- Prefer section headings, separators, and spacing for related content.

### Navigation
- Make current location clear.
- Preserve existing routes unless explicitly asked to change them.
- Keep public, client, gestoría, and admin navigation contextually appropriate.

## 6. Product and multi-tenant context

PreRenta serves:
- Public visitors considering the service.
- Taxpayer/client users.
- Gestoría staff and managers.
- Platform administrators.

The platform is intended to support multiple independent gestorías.

Therefore:
- Never hardcode a specific gestoría's name, logo, address, email, or contact details into shared components.
- Render organization-specific identity and data from the existing backend/application context.
- Never assume a user belongs to only one organization unless the backend contract confirms it.
- Do not expose another organization's clients, cases, documents, or messages.
- Frontend visibility is not authorization. Preserve backend authorization boundaries.
- Do not invent APIs, role mappings, organization membership, or permissions.
- Keep Clerk limited to authentication if that is the agreed architecture. Do not move business roles, tenant membership, or case ownership into Clerk without explicit authorization.
- Do not change URL patterns or routing unless the task explicitly requests it.

## 7. Localization

The product supports Spanish, English, and Valencian.

- Preserve the existing localization mechanism and translation keys.
- Do not hardcode new user-facing copy into components if the project uses translation files.
- Check text expansion in all supported languages.
- Do not assume English text lengths when designing buttons, navigation, tables, or form labels.
- Preserve accents and punctuation.
- Use locale-aware date, number, and currency formatting.
- Avoid concatenating translated fragments into grammatically incorrect sentences.

## 8. Responsive behavior

Design and verify at, at minimum:
- Small mobile: 320–375px.
- Standard mobile: 390–430px.
- Tablet: 768px.
- Desktop: 1280px and above.

Rules:
- Use fluid sizing where appropriate, with sensible min/max bounds.
- Prevent horizontal page overflow.
- Preserve readable line lengths and comfortable touch targets.
- Reflow content according to priority, not simply by shrinking desktop columns.
- Keep critical actions visible and reachable.
- Do not hide important information solely to make the layout fit.
- Respect reduced-motion preferences.

## 9. Motion and visual effects

- Motion must explain state change, hierarchy, or navigation.
- Prefer short, subtle transitions.
- Avoid animation on every card or element.
- Avoid scroll hijacking and unnecessary parallax.
- Support `prefers-reduced-motion`.
- Do not animate layout properties when transform/opacity can achieve the same effect.
- Never sacrifice performance or accessibility for visual novelty.

## 10. Implementation workflow — follow every time

Before editing:
1. Inspect the relevant page, route, components, styles, assets, and package configuration.
2. Identify the current design tokens and existing Sass architecture.
3. Understand the real data and interaction flow.
4. Identify which parts are shared and which are page-specific.
5. State a concise implementation plan when the task affects multiple components or global styling.

While editing:
1. Make the smallest coherent set of changes.
2. Reuse existing components and assets.
3. Keep business logic, API contracts, routes, and data untouched unless explicitly requested.
4. Use modular SCSS and semantic design tokens.
5. Do not replace working functionality with static mockups.
6. Do not add dependencies without a clear need.
7. Do not overwrite unrelated user changes.

After editing:
1. Run the available lint, type-check, test, and build commands when practical.
2. Inspect the actual rendered result, not only the source code.
3. Verify desktop and mobile layouts.
4. Test keyboard focus and interactive states.
5. Check for overflow, broken links, missing translations, and console/runtime errors.
6. Report exactly what changed, what was tested, and what remains incomplete.

## 11. Quality gate

Do not consider a UI task complete until these questions can be answered “yes”:

- Does the page feel intentionally designed for PreRenta rather than generated from a generic template?
- Is the hierarchy clear without relying on decorative cards or badges?
- Are typography, spacing, borders, and colors consistent with the system?
- Are all new styles modular SCSS using `@use`/`@forward`?
- Are interactions and existing functionality preserved?
- Are Spanish, English, and Valencian layouts considered?
- Does the page work at mobile, tablet, and desktop widths?
- Are accessibility and reduced-motion states handled?
- Have actual build/runtime checks been performed, or have limitations been clearly reported?

If a requested visual change conflicts with accessibility, real product behavior, or the established design system, explain the trade-off and choose the safer production-quality solution.
