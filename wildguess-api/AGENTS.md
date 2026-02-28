You are an expert in Node.js, TypeScript, and backend development. This document outlines the architecture, file structure, and testing philosophy for the `wildguess-api` project. You MUST follow these rules when generating or modifying code in the backend.

## Tech Stack Overview

- **Runtime:** Node.js (v20+)
- **Framework:** Hono (using `@hono/node-server`)
- **Database:** SQLite (via `better-sqlite3`)
- **ORM:** Drizzle ORM
- **Testing:** Vitest

## Fundamental Architecture

- The application separates the HTTP server instantiation (`src/index.ts`) from the Hono application definition (`src/app.ts`).
- **NEVER** instantiate the server `serve(...)` inside `src/app.ts`, as this breaks tests. `app.ts` should only define routes, middleware, and export the `app` instance.
- **High-Frequency State (Presence):** Large-scale, high-frequency updates (like "last seen" heartbeats) must be handled **in-memory** to avoid SQLite write-lock bottlenecks. Use the `PresenceStore` utility for heartbeat tracking. **CRITICAL:** Do NOT add high-frequency heartbeat columns to database tables.
- **Database Schema & Migrations:** The schema is defined in `src/database/schema.ts`. We use Drizzle migrations for all schema changes, located in the `drizzle/` directory. **NEVER** write manual `CREATE TABLE` SQL statements. Generate meaningful names for migration files.
- **Initialization:** Migrations and configuration validation are run on startup inside `src/index.ts`. If critical environment variables (like `POLLING_RATE_MS` and `ROOM_TIMEOUT_MS`) are logically inconsistent, the server must crash early and log a clear error.

## File Structure & Conventions

- `src/app.ts`: Core application, middleware attachments, and route mounting.
- `src/index.ts`: Entry point. Connects to the database, runs migrations, validates configuration, and starts the server.
- `src/routes/`: Route handlers. Grouped logically (e.g., `rooms.ts`, `auth.ts`).
- `src/database/`: Drizzle config, schema, and connection objects.
- `src/middleware/`: Custom Hono middleware (e.g., `auth.ts`).
- `src/utils/`: Pure functions and in-memory stores.
  - `presence.ts`: In-memory user presence tracking.
  - `room-purge.ts`: Logic for cleaning up stale rooms and reassigning hosts.
- `test/`: Integration tests and global setup logic.

## Testing Architecture

We utilize Vitest for both unit and integration tests.

### 1. Database Testing Environment

- Tests run against an **in-memory SQLite database** (`:memory:`).
- This is configured automatically in `vitest.config.ts`.
- **CRITICAL:** Before all tests run, the `test/setup.ts` file automatically executes the Drizzle migrations.

### 2. Integration Tests

- Location: `test/` directory.
- Method: Import `app` from `src/app.ts` and use `await app.request(...)`.
- Clean Up: Use `beforeEach` to delete records (`db.delete(table).run()`). For in-memory stores like `PresenceStore`, ensure they are explicitly cleared in `beforeEach` as well.

### 3. Unit Tests

- Location: Co-located next to implementation.
- Use Case: Pure utility functions, standalone classes, or complex business logic.

## Coding Standards

- **Database Health:** Optimize for SQLite. Avoid excessive writes in loops.
- **Config Invariants:** Ensure dependencies between environment variables are validated at startup.
- Extract complex business logic from route handlers into testable pure functions in `src/utils/`.
- Ensure all endpoints have request body validation and appropriate error status codes.
- Use explicit TypeScript types, especially for Hono environment variables (`AppEnv`) and JSON request bodies.
