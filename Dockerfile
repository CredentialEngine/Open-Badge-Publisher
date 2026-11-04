# syntax=docker/dockerfile:1.7
# UBI 10 Minimal builds the SvelteKit Node server; UBI 10 Micro runs it.
# Requires a committed package-lock.json including @sveltejs/adapter-node.

# ---- Build Stage ----
FROM registry.access.redhat.com/ubi10/ubi-minimal:10.2 AS builder

WORKDIR /app
USER root

# Install Node.js 26 and the libraries needed by its executable.
# For hardened CI, mirror/pin the NodeSource RPM repository internally.
RUN microdnf install -y bash curl tar gzip ca-certificates libstdc++ \
    && curl -fsSL https://rpm.nodesource.com/setup_26.x | bash - \
    && microdnf install -y nodejs \
    && microdnf clean all

RUN node --version && npm --version

# Install dependencies from the checked-in, reproducible lockfile.
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    npm ci

# Copy application sources. Private environment files are excluded by .dockerignore.
COPY . .
# Supply harmless placeholder PUBLIC_* names expected by $env/static/public.
# Docker ENV / --build-arg values override the corresponding example values.
COPY .env.example .env

# These are PUBLIC values compiled into browser JavaScript, NOT secrets.
# Pass production-specific values with --build-arg when building the image.
ARG PUBLIC_BASEURL=http://localhost:8080
ARG PUBLIC_UI_API_BASEURL=/publisher
ARG PUBLIC_PUBLISHER_API_BASEURL=https://sandbox.credentialengine.org/publisher
ARG PUBLIC_PUBLISHER_API_ENV_LABEL="(Sandbox)"
ENV PUBLIC_BASEURL=${PUBLIC_BASEURL} \
    PUBLIC_UI_API_BASEURL=${PUBLIC_UI_API_BASEURL} \
    PUBLIC_PUBLISHER_API_BASEURL=${PUBLIC_PUBLISHER_API_BASEURL} \
    PUBLIC_PUBLISHER_API_ENV_LABEL=${PUBLIC_PUBLISHER_API_ENV_LABEL} \
    PUBLIC_DEV_BYPASS_PUBLISHER_LOGIN=false \
    NODE_ENV=production

# Build the SvelteKit Node server. All quality gates run in Azure Pipelines.
RUN npm run build

# Remove build-only packages; keep modules required by the generated server.
RUN npm prune --omit=dev && npm cache clean --force

# ---- Runtime Stage ----
FROM registry.access.redhat.com/ubi10/ubi-micro:10.2 AS runtime

WORKDIR /app

# NodeSource's Node binary and its UBI-compatible runtime shared libraries.
# UBI Micro has no package manager or shell; do not use RUN here.
COPY --from=builder /usr/bin/node /usr/bin/node
COPY --from=builder /usr/lib64/ /usr/lib64/

# SvelteKit adapter-node output, package metadata and production-only modules.
COPY --from=builder --chown=1001:0 /app/build ./build
COPY --from=builder --chown=1001:0 /app/package.json ./package.json
COPY --from=builder --chown=1001:0 /app/node_modules ./node_modules

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    HOME=/tmp

USER 1001:0
EXPOSE 8080

# The SvelteKit adapter already provides the production Node HTTP server.
CMD ["/usr/bin/node", "/app/build/index.js"]
