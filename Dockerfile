# Production Dockerfile for Zoqonyx Email Marketing
FROM node:20-alpine AS base

# Install OpenSSL for Prisma engines
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Dependencies Stage
FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Runner Stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["npm", "run", "start"]
