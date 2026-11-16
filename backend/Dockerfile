# syntax=docker/dockerfile:1

# ------------------------------------------------------------------------------
# Backend Dockerfile (NestJS 11 + Prisma 7 on Debian Slim)
# ------------------------------------------------------------------------------

FROM node:22-bookworm-slim AS base
WORKDIR /app

# Install openssl for Prisma engine runtime and ca-certificates
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# --- Build Stage ---
FROM base AS builder

# Install build dependencies for native compilation (e.g., bcrypt)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Copy schema and configuration files
COPY prisma ./prisma/
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/
COPY public ./public/

# Generate Prisma client and build NestJS bundle
RUN npx prisma generate
RUN npm run build

# Remove development dependencies to keep final bundle lean
RUN npm prune --omit=dev

# --- Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Run as non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nestjs

# Copy pruned dependencies and built artifacts
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/public ./public

# Ensure upload and private storage directories exist with proper write permissions
RUN mkdir -p public/uploads uploads/private_receipts && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

CMD ["node", "dist/main.js"]
