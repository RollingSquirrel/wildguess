# Agent Onboarding & Context Hub

Welcome, Agent. This project, **Wildguess**, is a high quality Planning Poker application built with a focus on modern web standards, accessibility, and high-performance real-time updates.

## Project Structure

The codebase is split into two main components:

- **Frontend (`./wildguess`)**: An Angular SPA built with Tailwind CSS v4 and Signals.
  - 📖 **Mandatory Rules**: [wildguess/AGENTS.md](./wildguess/AGENTS.md)
  - 🎨 **Style System**: [docs/style-system.md](./docs/style-system.md)
- **Backend (`./wildguess-api`)**: A Node.js API using Hono, SQLite (Drizzle ORM), and Vitest.
  - 📖 **Mandatory Rules**: [wildguess-api/AGENTS.md](./wildguess-api/AGENTS.md)

## Core Technical Principles

### 1. High Quality Aesthetics (Frontend)

Wildguess uses **Tailwind CSS v4** with a CSS-first configuration.

- **Tokens**: All design tokens (colors, animations) live in [styles.css](./wildguess/src/styles.css) inside the `@theme` block.
- **Components**: Reusable UI primitives (Buttons, Inputs, Modals) are located in `src/app/ui/`.
- **Inline-First**: Page-specific styling should use Tailwind utility classes directly in templates. Avoid component-specific CSS files.

### 2. High-Frequency State (Backend)

To prevent SQLite write-lock bottlenecks:

- **Presence**: User heartbeats and high-frequency "last seen" updates are handled **in-memory** via `PresenceStore`.

### 3. Standards & Tools

- **Package Manager**: `pnpm`.
- **State Management**: Angular Signals (Frontend) and Hono Context/In-memory stores (Backend).
- **Accessibility**: Strict adherence to WCAG AA and AXE checks is required for all frontend changes.
- **Testing**: Vitest for both frontend and backend. Backend tests use an in-memory SQLite database.

## Workflow

1. **Research**: Consult the sub-project `AGENTS.md` before making changes.
2. **Verify**: Ensure all tests pass and accessibility requirements are met.
