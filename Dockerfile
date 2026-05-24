# syntax=docker/dockerfile:1.7
# Static SPA build of the Expo web target, served with `serve --single`.
# Designed for Railway, but builds anywhere Docker runs.

# ─── Stage 1: install + build the web bundle ──────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# pnpm via corepack (version pinned by app/package.json#packageManager).
RUN corepack enable

# Copy the entire pnpm workspace (lockfile-driven install for cache hits).
COPY app /repo/app

WORKDIR /repo/app
RUN pnpm install --frozen-lockfile

# Build args become inlined into the bundle by `expo export -p web`.
# Railway exposes service variables to the build via build args automatically.
# Every EXPO_PUBLIC_* the client reads at bundle time must be listed here;
# otherwise the builder stage never sees it and Metro inlines `undefined` / defaults.
ARG EXPO_PUBLIC_ENVIRONMENT
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_ENVIRONMENT=${EXPO_PUBLIC_ENVIRONMENT}
ENV EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY}

RUN pnpm build:web

# ─── Stage 2: tiny runtime that serves the static dist with SPA fallback ──
FROM node:20-alpine AS runner
WORKDIR /srv
RUN npm install --global serve@14
COPY --from=builder /repo/app/apps/mobile/dist ./dist
ENV PORT=3000
EXPOSE 3000
# `--single` rewrites unknown paths to index.html (deep-link refresh).
CMD ["sh", "-c", "serve dist --single --listen ${PORT:-3000}"]
