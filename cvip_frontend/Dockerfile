# Build context: repository root (lockfile shared by the workspaces)
# NOSONAR S8431: the tag documents the version, the digest pins it (Dependabot updates both).
FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/prepare.mjs scripts/
COPY cvip_backend/package.json cvip_backend/
COPY cvip_frontend/package.json cvip_frontend/
COPY cvip_cucumber/package.json cvip_cucumber/
COPY cvip_playwright/package.json cvip_playwright/
RUN npm ci -w cvip_frontend

COPY cvip_frontend cvip_frontend
RUN npm run build -w cvip_frontend

# NOSONAR S8431: the tag documents the version, the digest pins it (Dependabot updates both).
FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e

# Backend URL that /api/* is proxied to (substituted at startup)
ENV BACKEND_URL=http://backend:3000

COPY cvip_frontend/nginx/default.conf.template /etc/nginx/templates/
COPY --from=build /app/cvip_frontend/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
