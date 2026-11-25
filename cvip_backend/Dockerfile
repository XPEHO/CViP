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
RUN npm ci -w cvip_backend

COPY cvip_backend/tsconfig.json cvip_backend/
COPY cvip_backend/src cvip_backend/src
RUN npm run build -w cvip_backend
# The tests are compiled next to the code (they run from dist/): they have no place in the image.
RUN find cvip_backend/dist -name '*.test.js*' -delete && rm -rf cvip_backend/dist/test-utils

# NOSONAR S8431: the tag documents the version, the digest pins it (Dependabot updates both).
FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY scripts/prepare.mjs scripts/
COPY cvip_backend/package.json cvip_backend/
COPY cvip_frontend/package.json cvip_frontend/
COPY cvip_cucumber/package.json cvip_cucumber/
COPY cvip_playwright/package.json cvip_playwright/
RUN npm ci --omit=dev -w cvip_backend

COPY --from=build /app/cvip_backend/dist cvip_backend/dist
COPY cvip_backend/migrations cvip_backend/migrations

USER node
WORKDIR /app/cvip_backend
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node --eval "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
