# Contexte de build : racine du repo (lockfile partagé des workspaces)
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci -w frontend

COPY frontend frontend
RUN npm run build -w frontend

FROM nginx:1.29-alpine

# URL du backend vers laquelle /api/* est proxifié (substituée au démarrage)
ENV BACKEND_URL=http://backend:3000

COPY frontend/nginx/default.conf.template /etc/nginx/templates/
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
