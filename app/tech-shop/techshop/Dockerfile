# syntax=docker/dockerfile:1.7
# =============================================================================
# Build TechShop Admin FE (Vite/rolldown + React 19).
# Usage:
#   docker build \
#     --build-arg VITE_API_BASE_URL=http://admin.dev.techshop.local \
#     -t techshop-admin:dev .
# =============================================================================

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=""
ARG VITE_API_KEY_TINY=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_KEY_TINY=${VITE_API_KEY_TINY}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx vite build

FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
