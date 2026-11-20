# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# O build não acessa o banco (páginas com dados são renderizadas por requisição)
RUN DATABASE_URL=postgres://build:build@localhost/build APP_SECRET=build-time-placeholder-not-used-at-runtime-000 npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd -r app && useradd -r -g app app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Migrações, seed e scripts administrativos
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/drizzle.config.ts ./
COPY --from=build /app/seed ./seed
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
RUN mkdir -p /app/storage && chown -R app:app /app/storage
USER app
EXPOSE 3000
CMD ["node", "server.js"]
