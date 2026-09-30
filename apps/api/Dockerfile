FROM node:22-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /repo

FROM base AS development
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @manutencao/shared build
RUN pnpm --filter @manutencao/api exec prisma generate
EXPOSE 3000
CMD ["sh", "apps/api/docker-entrypoint-dev.sh"]

FROM base AS production
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @manutencao/shared build
RUN pnpm --filter @manutencao/api exec prisma generate
RUN pnpm --filter @manutencao/api build
RUN chmod +x apps/api/docker-entrypoint.sh
EXPOSE 3000
CMD ["sh", "apps/api/docker-entrypoint.sh"]
