FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations and workspace packages
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and build
RUN npm install
RUN npm --workspace=@boi-hat/shared-types run build
RUN cd apps/api && npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

EXPOSE 4000

CMD ["sh", "-c", "cd apps/api && npx prisma db push --skip-generate && npm run prisma:seed && npm run start:prod"]
