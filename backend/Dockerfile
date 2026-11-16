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
RUN npm ci || npm install

# Copy schema, scripts, and configuration files
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY docker-entrypoint.sh ./docker-entrypoint.sh
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
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh -m nestjs

# Copy pruned dependencies and built artifacts
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nestjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/public ./public
COPY --from=builder --chown=nestjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Ensure upload, private storage directories exist, and entrypoint is executable
RUN chmod +x ./docker-entrypoint.sh && \
    mkdir -p public/uploads uploads/private_receipts && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
