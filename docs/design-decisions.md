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

### Docker Stack
**Decision**: Three-container Docker Compose stack: **Nginx (reverse proxy) → Client (Angular static) → API (Hono/Node.js)**.

**Rationale**: Clean separation of concerns. Nginx handles TLS termination, gzip, security headers, and routing. The Angular app is pre-built into static files served by an internal Nginx instance. The API runs as a plain Node.js process. All containers use Alpine-based images for minimal size. The API runs as a non-root `node` user.

### Environment Configuration
| Variable | Container | Default | Description |
|----------|-----------|---------|-------------|
| `PORT` | api | `3000` | API listen port |
| `DB_PATH` | api | `/data/sqlite.db` | SQLite database file path |
| `CORS_ORIGIN` | api | `*` | Allowed origins (comma-separated or `*`) |
| `BASE_URL` | client, nginx | `/` | Sub-path for hosting (e.g. `/wildguess/`) |
| `SSL_CERT` | nginx | — | Path to SSL certificate inside container |
| `SSL_KEY` | nginx | — | Path to SSL private key inside container |
| `HTTP_PORT` | nginx (host) | `8080` | Host port mapped to Nginx HTTP |
| `HTTPS_PORT` | nginx (host) | `8443` | Host port mapped to Nginx HTTPS |

### SSL Termination
**Decision**: Optional SSL at the Nginx reverse proxy layer. Default is HTTP-only. HTTPS is enabled by mounting cert/key files and setting `SSL_CERT`/`SSL_KEY` env vars on the Nginx container.

**Rationale**: SSL is offloaded to the edge proxy so backend containers don't need certificates. The entrypoint selects between an HTTP-only and an HTTPS template at startup. When HTTPS is enabled, HTTP automatically redirects to HTTPS with HSTS headers.

### Base URL Rewrite
**Decision**: The Angular `<base href="/">` is rewritten at container startup via the client container's entrypoint script using the `BASE_URL` environment variable.

**Rationale**: This allows the same Docker image to be deployed at any sub-path without rebuilding. The `sed` replacement happens once at startup, before Nginx serves the static files.

### Data Persistence
**Decision**: SQLite database persisted via a Docker named volume (`wildguess-data`) mounted at `/data` in the API container.

**Rationale**: Named volumes survive container restarts and upgrades. The `DB_PATH` env var points the API to the volume-mounted path. WAL mode remains enabled for concurrent read performance during polling.

