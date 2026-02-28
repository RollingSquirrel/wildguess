# Wildguess

Wildguess is a fullstack application for planning poker.

It is meant to be used by small teams to estimate the effort required for tasks providing a great UI experience.
Wildguess respects limitations of hosting behind reverse proxies and load balancers.

## Configuration

| Variable          | Container     | Default           | Description                                        |
| ----------------- | ------------- | ----------------- | -------------------------------------------------- |
| `PORT`            | api           | `3000`            | API listen port                                    |
| `DB_PATH`         | api           | `/data/sqlite.db` | SQLite database file path                          |
| `CORS_ORIGIN`     | api           | `*`               | Allowed origins (comma-separated or `*`)           |
| `POLLING_RATE_MS` | api           | `3000`            | Frontend polling interval in milliseconds          |
| `ROOM_TIMEOUT_MS` | api           | `30000`           | Inactivity timeout before removing users from room |
| `BASE_URL`        | client, nginx | `/`               | Sub-path for hosting (e.g. `/wildguess/`)          |
| `API_HOST`        | nginx         | `api`             | Hostname/IP of the API container                   |
| `API_PORT`        | nginx         | `3000`            | Port of the API container                          |
| `CLIENT_HOST`     | nginx         | `client`          | Hostname/IP of the client container                |
| `CLIENT_PORT`     | nginx         | `80`              | Port of the client container                       |
| `SSL_CERT`        | nginx         | —                 | Path to SSL certificate inside container           |
| `SSL_KEY`         | nginx         | —                 | Path to SSL private key inside container           |
| `HTTP_PORT`       | nginx (host)  | `8080`            | Host port mapped to Nginx HTTP                     |
| `HTTPS_PORT`      | nginx (host)  | `8443`            | Host port mapped to Nginx HTTPS                    |

## Tech Stack

- **Frontend**: Angular 21 - named wildguess
- **Backend**: Hono - named wildguess-api
- **Database**: Drizzle ORM + SQLite
- **Deployment**: Node.js (Dockerized)
- **Styling**: TailwindCSS v4, Animation support with anime.js

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Backend

```bash
cd wildguess-api
pnpm install
pnpm dev
```

The API server starts on `http://localhost:3000`.

### Frontend

```bash
cd wildguess
pnpm install
pnpm start
```

The Angular dev server starts on `http://localhost:4200` with proxy to the API.

## Documentation

Architecture and design decisions are documented in the [docs/](docs/) directory.
