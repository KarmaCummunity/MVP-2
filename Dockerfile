# syntax=docker/dockerfile:1.7
# Two-stage build: Expo web bundle → Node 20 Hono server.
# Designed for Railway, builds anywhere Docker runs.

# ─── Stage 1: install + build the web bundle ──────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

RUN corepack enable
COPY app /repo/app
WORKDIR /repo/app
RUN pnpm install --frozen-lockfile

# Every EXPO_PUBLIC_* the client reads at bundle time must be listed here;
# otherwise the builder stage never sees it and Metro inlines `undefined`.
ARG EXPO_PUBLIC_ENVIRONMENT
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_WEB_BASE_URL
ENV EXPO_PUBLIC_ENVIRONMENT=${EXPO_PUBLIC_ENVIRONMENT}
ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}
ENV EXPO_PUBLIC_WEB_BASE_URL=${EXPO_PUBLIC_WEB_BASE_URL}

RUN pnpm build:web

# ─── Stage 2: Hono server with OG meta + static SPA + SPA fallback ────
FROM node:20-alpine AS runner
WORKDIR /srv

# Server package brings hono + @hono/node-server only. Tiny dep surface.
COPY --from=builder /repo/app/apps/mobile/web-server/package.json ./
COPY --from=builder /repo/app/apps/mobile/web-server/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /repo/app/apps/mobile/web-server/server.mjs ./server.mjs
COPY --from=builder /repo/app/apps/mobile/web-server/i18n ./i18n
COPY --from=builder /repo/app/apps/mobile/dist ./dist

ENV PORT=3000
ENV WEB_DIST_DIR=/srv/dist
EXPOSE 3000

# SUPABASE_URL, SUPABASE_ANON_KEY, APP_BASE_URL are injected by Railway at runtime.
CMD ["node", "server.mjs"]
