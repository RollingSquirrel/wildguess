# ---- Build stage ----
FROM node:24-alpine AS build

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY angular.json tsconfig.json tsconfig.app.json .postcssrc.json ./
COPY src/ src/
COPY public/ public/
RUN pnpm build

# ---- Serve stage ----
FROM nginx:alpine-slim AS production

# Copy custom nginx config for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist/wildguess/browser /usr/share/nginx/html

# Copy entrypoint script
COPY entrypoint.sh /docker-entrypoint.d/40-base-url-rewrite.sh
RUN chmod +x /docker-entrypoint.d/40-base-url-rewrite.sh

ENV BASE_URL=/

EXPOSE 80
