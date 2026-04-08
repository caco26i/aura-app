# syntax=docker/dockerfile:1
# Production static bundle: Vite build → nginx:alpine with SPA fallback.
# API traffic uses same-origin /v1 (proxied by nginx) when deployed with root docker-compose.yml.

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time only — inlined into the client bundle (see web/docs/DEPLOY.md).
ARG VITE_AURA_API_TOKEN=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_AURA_API_URL=
ARG VITE_AURA_BFF_URL=
ARG VITE_AURA_TELEMETRY_ENDPOINT=
ARG VITE_AURA_TELEMETRY_DEBUG=

ENV VITE_AURA_API_TOKEN=$VITE_AURA_API_TOKEN \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_AURA_API_URL=$VITE_AURA_API_URL \
    VITE_AURA_BFF_URL=$VITE_AURA_BFF_URL \
    VITE_AURA_TELEMETRY_ENDPOINT=$VITE_AURA_TELEMETRY_ENDPOINT \
    VITE_AURA_TELEMETRY_DEBUG=$VITE_AURA_TELEMETRY_DEBUG

RUN npm run build

FROM nginx:1.27-alpine AS run
RUN apk add --no-cache gettext && mkdir -p /etc/nginx/presets /etc/nginx/snippets
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-docker.conf nginx-docker-bff.conf /etc/nginx/presets/
COPY nginx-fragment-telemetry-empty.conf nginx-fragment-telemetry.conf.template /etc/nginx/presets/
COPY docker-entrypoint.d/40-aura-telemetry-fragment.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/40-aura-telemetry-fragment.sh
EXPOSE 80
