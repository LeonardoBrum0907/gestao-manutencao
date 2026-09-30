FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @manutencao/shared build
RUN pnpm --filter @manutencao/web build

FROM node:22-bookworm-slim AS development
RUN corepack enable && corepack prepare pnpm@11.8.0 --activate
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @manutencao/shared build
EXPOSE 80
CMD ["pnpm", "--filter", "@manutencao/web", "exec", "vite", "--host", "0.0.0.0", "--port", "80"]

FROM nginx:1.27-alpine AS production
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
