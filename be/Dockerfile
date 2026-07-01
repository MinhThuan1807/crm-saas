FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM node:22-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 7: prisma.config.ts reads DATABASE_URL at generate time.
# Pass a dummy URL so the build doesn't fail — real URL is injected at runtime via env_file.
ARG DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV DATABASE_URL=$DATABASE_URL

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app (includes generated Prisma client in dist/generated)
RUN npm run build



FROM node:22-slim AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/generated ./generated
COPY package.json ./

EXPOSE 3001

# Use dist/src/main.js because current build output is under dist/src
CMD ["node", "dist/src/main.js"]
