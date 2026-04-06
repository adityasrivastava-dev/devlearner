# ── Stage 1: Build React / Vite app ──────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install deps first (cached layer)
COPY package*.json ./
RUN npm ci --silent

# Copy source
COPY . .

# VITE_API_URL is baked into the JS bundle at build time.
# On Render: set this as an Environment Variable on the frontend service.
# e.g.  VITE_API_URL=https://devlearner-api.onrender.com
# If not set, API calls use relative URLs (proxied by Nginx — works for docker-compose).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# gettext provides envsubst (needed to inject BACKEND_URL into nginx.conf at runtime)
RUN apk add --no-cache gettext

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built React app
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# envsubst fills in $BACKEND_URL from the Render env var, then starts nginx
CMD ["/bin/sh", "-c", \
  "envsubst '${BACKEND_URL}' < /etc/nginx/templates/default.conf.template \
   > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
