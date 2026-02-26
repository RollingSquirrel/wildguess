# Wildguess

Wildguess is a fullstack application for planning poker.

It is meant to be used by small teams to estimate the effort required for tasks providing a great UI experience.
Wildguess respects limitations of hosting behind reverse proxies and load balancers.

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
