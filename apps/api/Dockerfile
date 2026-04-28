FROM node:20-bookworm-slim AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/chess-engine/package.json packages/chess-engine/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json

RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages packages

RUN pnpm --filter @chess-platform/chess-engine build
RUN pnpm --filter @chess-platform/api build
RUN pnpm prune --prod

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV="production"
ENV PORT="8080"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/chess-engine/package.json ./packages/chess-engine/package.json
COPY --from=builder /app/packages/chess-engine/dist ./packages/chess-engine/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
