# syntax=docker/dockerfile:1.7
# =============================================================================
# Build TechShop Customer FE (Vite + React 19).
# Usage:
#   docker build \
#     --build-arg VITE_API_BASE_URL=http://shop.dev.techshop.local \
#     -t ecommerce-customer:dev .
# =============================================================================

# ---- Stage 1: install deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- Stage 2: build production bundle ----
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: nginx runtime ----
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# nginx image đã có healthcheck mặc định; entrypoint giữ nguyên
