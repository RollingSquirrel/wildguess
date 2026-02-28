# ---- Build stage ----
FROM node:24-alpine AS build

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ src/
RUN pnpm build

# ---- Production stage ----
FROM node:24-alpine AS production

WORKDIR /app

# Non-root user for security
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install production deps only (includes native better-sqlite3)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from build stage
COPY --from=build /app/dist ./dist

# Copy migrations folder
COPY drizzle/ ./drizzle

# Create data directory for SQLite volume mount
RUN mkdir -p /data && chown node:node /data

ENV PORT=3000
ENV DB_PATH=/data/sqlite.db

EXPOSE ${PORT}

USER node

CMD ["node", "dist/index.js"]
