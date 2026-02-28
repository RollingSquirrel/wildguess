# Wildguess Style System

> This document describes the Wildguess styling architecture. It covers the theme system, reusable component classes, and conventions for adding new UI.

## Overview

Wildguess uses **Tailwind CSS v4** with a custom dark theme. The styling follows two principles:

1. **Global theme** → Design tokens, keyframes, and base resets live in `styles.css`
2. **UI Component Library** → Reusable elements (Buttons, Inputs, Modals) are built as Angular standalone components in `src/app/ui/`
3. **Inline Tailwind** → Page-specific layout and unique styling use Tailwind utility classes directly in component templates

## Technology Setup

| Concern       | Technology                                 |
| ------------- | ------------------------------------------ |
| CSS Framework | Tailwind CSS v4 (PostCSS plugin)           |
| Config        | `src/styles.css` (CSS-first config)        |
| PostCSS       | `.postcssrc.json` → `@tailwindcss/postcss` |
| Animations    | CSS `@keyframes` + anime.js (donut chart)  |
| Font          | Inter (via `--font-sans` theme token)      |

> **Important**: Tailwind v4 uses CSS-first configuration. There is no `tailwind.config.js`. All theme tokens are defined inside `@theme { }` in `src/styles.css`.

## What lives where

### `src/styles.css` (global)

| Section             | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| `@theme { }`        | Design tokens → colors, fonts, animations                 |
| `@keyframes`        | Animation definitions referenced by `--animate-*` tokens  |
| Base CSS            | `html`/`body` resets, scrollbar, focus ring, button reset |
| `@layer components` | Shared styles that can be overridden by utility classes   |
| `@utility`          | Custom one-off Tailwind utilities                         |

### `src/app/ui/` (shared components)

Reusable UI primitives like `wgButton`, `wgInput`, and `wg-modal`. These encapsulate complex styling logic (hover states, variants, focus rings) into easy-to-use Angular components/directives.

### Component templates (page-specific)

Page layout, section structure, and one-off styling use Tailwind utility classes directly in component templates.

**Crucially, there are NO separate `.css` files per page.**

If a style pattern is too complex for inline utilities (e.g., uses pseudo-elements or complex animations), it must be moved to a **reusable UI component** in `src/app/ui/`. These UI components may use localized `styles:` blocks with `@reference` if necessary, but the goal is to keep the application modular.

## Design Tokens (`@theme`)

All design tokens are defined in the `@theme` block. Tailwind v4 automatically generates utility classes from these.

### Color System

```
Backgrounds:
  --color-bg-primary        bg-bg-primary          (#0a0e14)
  --color-bg-secondary      bg-bg-secondary        (#111820)
  --color-bg-surface        bg-bg-surface          (#1a2332)
  --color-bg-surface-hover  bg-bg-surface-hover    (#222e3f)
  --color-bg-card           bg-bg-card             (#151d29)

Brand / Accent:
  --color-primary           text-primary, bg-primary    (#00e676)
  --color-primary-dim       bg-primary-dim              (#00c863)
  --color-primary-glow      — (shadows only)            (rgba green)
  --color-primary-subtle    bg-primary-subtle           (8% green)

Text:
  --color-text-primary      text-text-primary      (#e8edf4)
  --color-text-secondary    text-text-secondary    (#8899aa)
  --color-text-muted        text-text-muted        (#556677)

Borders:
  --color-border            border-border          (#1e2a3a)
  --color-border-hover      border-border-hover    (#2a3a4e)

Semantic:
  --color-danger            text-danger             (#ff4d6a)
  --color-warning           text-warning            (#ffaa00)
  --color-info              text-info               (#40c4ff)
  + subtle variants for tinted backgrounds
```

### How to use colors

```html
<!-- ✅ DO: Use Tailwind theme classes -->
<span class="text-primary">Wild</span>
<div class="bg-bg-surface border border-border">...</div>

<!-- ❌ DON'T: Use arbitrary var() syntax -->
<span class="text-[var(--color-primary)]">Wild</span>
```

### Animation Tokens

Theme tokens named `--animate-*` → usable as Tailwind classes:

| Class                     | Use                    |
| ------------------------- | ---------------------- |
| `animate-fade-in`         | Modal backdrops        |
| `animate-slide-up`        | Modal cards            |
| `animate-slide-up-slow`   | Stats, sections        |
| `animate-slide-up-entry`  | Auth card entrance     |
| `animate-pulse-glow`      | Ready-to-reveal button |
| `animate-phase-enter`     | Phase transition       |
| `animate-result-slide-in` | Result rows            |
| `animate-versus-enter`    | Versus arena entrance  |
| `animate-fighter-pulse`   | Fighter card glow      |
| `animate-vs-pulse`        | VS badge pulse         |
| `animate-room-card-entry` | Room card entrance     |

## UI Component System

Instead of global CSS classes, we use Angular standalone components and directives in `src/app/ui/`.

| Component/Directive | Usage                                                                              |
| ------------------- | ---------------------------------------------------------------------------------- |
| `[wgButton]`        | Button directive with variants: `primary`, `sm`, `ghost`, `cancel`, `danger-ghost` |
| `[wgInput]`         | Input directive with variants: `default`, `sm`                                     |
| `wg-badge`          | Badge component with semantic variants (host, member, phases)                      |
| `wg-modal`          | Modal overlay with backdrop blur and entry animations                              |
| `wg-error-banner`   | Error notification banner with `alert` role                                        |

### Usage Example:

```html
<button wgButton variant="primary" (click)="doSomething()">Click Me</button>
<input wgInput placeholder="Type here..." />
<wg-badge variant="host">Host</wg-badge>
```

## Style Rules for Adding New UI

### 1. Tailwind-first in templates

Use Tailwind utility classes directly in templates for layout, spacing, typography, and page-specific styling:

```html
<!-- ✅ Inline Tailwind for page-specific layout -->
<div class="grid gap-6 grid-cols-1 md:grid-cols-[1fr_220px]">
  <aside
    class="bg-bg-surface border border-border rounded-xl p-4 h-fit sticky top-4"
  ></aside>
</div>
```

### 2. Always use theme tokens

Never hardcode colors. Use the theme token classes:

```html
<!-- ✅ -->
<div class="bg-bg-surface border border-border text-text-primary">
  <!-- ❌ -->
  <div style="background: #1a2332; border: 1px solid #1e2a3a"></div>
</div>
```

### 3. Create component classes only for patterns that can't be inlined

Add to `@layer components` in `styles.css` only when:

- The pattern uses pseudo-elements (`::before`, `::after`)
- It needs parent-child selectors (`.parent .child`)
- It's genuinely reused across multiple pages
- Complex multi-state hover/active/focus interactions

```css
@layer components {
  .my-interactive-card {
    @apply bg-bg-surface border border-border rounded-xl;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .my-interactive-card::before { ... }
  .my-interactive-card:hover { ... }
}
```

### 4. Conditional styling in Angular templates

Use Angular class bindings for state-dependent styles:

```html
<!-- Boolean toggle -->
<div
  class="size-8 rounded-full"
  [class.border-primary]="member.hasVoted()"
  [class.text-primary]="member.hasVoted()"
  [class.border-border]="!member.hasVoted()"
></div>

<!-- Dynamic class switching (Signals) -->
<button
  [class]="'base-classes ' + (isActive()
    ? 'bg-primary text-bg-primary'
    : 'bg-transparent text-text-secondary')"
></button>
```

### 5. Using the Badge Component

```html
<wg-badge [variant]="asBadgeVariant('phase-' + room().phase)">
  {{ room().phase }}
</wg-badge>
```

## Accessibility Notes

- **Focus ring**: All interactive elements get a 2px solid green outline via `*:focus-visible`
- **Color contrast**: Text/background combinations meet WCAG AA:
  - `#e8edf4` on `#0a0e14` → 14.2:1 ✓
  - `#8899aa` on `#1a2332` → 4.6:1 ✓
  - `#00e676` on `#0a0e14` → 8.8:1 ✓
- **Buttons**: All have `:disabled` states with reduced opacity and `cursor: not-allowed`
- **ARIA**: Templates use `aria-label`, `aria-pressed`, `aria-hidden`, and `role="alert"`
