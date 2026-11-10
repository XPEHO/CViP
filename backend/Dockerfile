# Contexte de build : racine du repo (lockfile partagé des workspaces)
FROM node:26-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev -w backend

COPY backend/src backend/src
COPY backend/migrations backend/migrations

# Point de montage du volume photos, inscriptible par l'utilisateur node
RUN mkdir -p /data/photos && chown node:node /data/photos

USER node
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "src/server.js"]
