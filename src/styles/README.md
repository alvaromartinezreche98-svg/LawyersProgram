# PreRenta styles

Modular Sass (`@use` / `@forward`, no `@import`) on top of Tailwind 4.

| Folder | Holds | Emits CSS |
|---|---|---|
| `abstracts/` | `_tokens.scss` (every design value), `_functions.scss` (`space()`, `radius()`, `duration()`), `_mixins.scss` (`from()`, `hover`, `motion-ok`, `focus-ring`, `type()`, `custom-properties()`) | no |
| `base/` | layer order, tokens as CSS custom properties (light + opt-in dark), global defaults, text styles (`.t-display`, `.t-title`, `.t-section`, `.t-card`, `.t-body`, `.t-meta`, `.t-eyebrow`, `.t-label`) | yes |
| `layout/` | page-frame rules (gestoría shell) | yes |
| `components/` | `.btn-fx*` + `.btn-spinner`, `.field` / `.field-group` / `.field-unit`, `.table-head`, `.accordion`, landing headline and Cómo funciona motion | yes |
| `utilities/` | accessibility safety nets | yes |

`main.scss` is loaded from `app/layout.tsx` after `app/globals.css`, which keeps only what Tailwind must process: the token → utility mapping (`@theme`), custom variants and `@utility` helpers.

Rules of thumb
- Change a colour, size or spacing in `abstracts/_tokens.scss`, never in a component.
- Components use the CSS custom properties (`var(--accent)`) or Tailwind classes mapped to them (`bg-accent`), never raw hex.
- Reusable look → a class in `components/` inside `@layer components`, so a Tailwind utility on the element can still adjust it.
- Movement only inside `motion-ok`; hover only inside the `hover` mixin or `@media (hover: hover)`.
- Breakpoints: `sm 640`, `md 768`, `rail 960`, `lg 1024`, `xl 1280` (same as Tailwind's).
