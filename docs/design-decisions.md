# Design Decisions

## Architecture

### Polling vs WebSockets
**Decision**: Use HTTP polling (3-second intervals) instead of WebSockets.

**Rationale**: The app is designed to run behind reverse proxies (Nginx) and load balancers. WebSocket connections can be problematic in these setups, requiring sticky sessions and additional configuration. Since we expect small teams (typically 3-10 people), polling every 3 seconds is perfectly adequate and dramatically simplifies the deployment topology.

### Authentication
**Decision**: Session-token-based auth with `crypto.scryptSync` for password hashing.

**Rationale**: The app is standalone — no external auth providers. We use random hex tokens stored in a `sessions` table rather than JWTs. This lets us invalidate sessions server-side (e.g. on logout) without any token blacklist complexity. Tokens expire after 7 days. `scryptSync` is a memory-hard KDF built into Node.js, providing strong password security without additional dependencies.

### Host Migration
**Decision**: When the host leaves a room, the next member (by join order) becomes host automatically.

**Rationale**: This ensures rooms always have a host to control the voting flow. Using join order is deterministic and fair.

## Frontend

### State Management
**Decision**: Use Angular signals for all component state. No NgRx or other state management library.

**Rationale**: The app state is simple and scoped per page. Room state is polled from the server (source of truth), so complex client-side state management would add unnecessary complexity.

### Early Vote Reveal
**Decision**: The host is permitted to reveal votes even if the room has not fully voted.

**Rationale**: This guarantees that if a participant goes AFK or drops without closing their session, the host can proceed with the vote without locking up the entire room. A progress indicator is shown to the host to inform them of the vote completion status before revealing.

### Phase-Based Rendering
**Decision**: The room page renders different views based on the room's `phase` signal (`voting` → `revealed` → `versus` → back to `voting`).

**Rationale**: This maps naturally to the planning poker workflow and allows each phase to have its own animations and transitions. The phase is server-authoritative, so all participants see transitions simultaneously (within the polling interval).

### Animations
**Decision**: Use CSS animations and `@keyframes` for all phase transitions, card flips, and the versus arena. Background particles use `requestAnimationFrame` on canvas.

**Rationale**: CSS animations are hardware-accelerated and lightweight. The canvas-based particles provide the subtle "fire spark" ambient effect without affecting the DOM. anime.js is available in the project for future enhancement of more complex animation sequences.

## Backend

### Database: SQLite via Drizzle ORM
**Decision**: Use SQLite as the database with WAL mode enabled.

**Rationale**: SQLite is zero-config, file-based, and perfectly suitable for small team usage. WAL mode allows concurrent reads during writes, which is important since multiple users poll the room state simultaneously. Drizzle ORM provides type-safe queries with minimal overhead.

### Room Codes
**Decision**: Use 6-character random hex codes (e.g., `A1B2C3`) as room identifiers.

**Rationale**: Short enough to share verbally or via chat, unique enough for the expected usage scale.

## Deployment Architecture

The app will run in a Docker stack: **Nginx → API → Client**. The Angular app is served as static files. Nginx proxies `/api/*` to the Hono backend. No Dockerfiles are created yet, but the architecture supports this topology without code changes.
