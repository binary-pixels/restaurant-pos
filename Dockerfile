# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/admin/package.json ./apps/admin/

RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client and build
RUN npx prisma generate --schema=./apps/admin/prisma/schema.prisma
RUN npm run build -w apps/admin

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built output and dependencies
COPY --from=builder /app/apps/admin/.next ./apps/admin/.next
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma
COPY --from=builder /app/apps/admin/package.json ./apps/admin/
COPY --from=builder /app/apps/admin/next.config.mjs ./apps/admin/
COPY --from=builder /app/apps/admin/.env.local ./apps/admin/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "apps/admin"]
