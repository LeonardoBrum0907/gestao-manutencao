# Gestão de Manutenção

Caderno do gestor: captura rápida e ficha. Fatias 1 a 6.

## Subir

Copie `.env.example` para `.env` e preencha `DATABASE_URL` (banco `manutencao`) e `SESSION_SECRET`.

```bash
docker compose up --build
```

- App: http://localhost:8080
- Saúde: http://localhost:8080/health e http://localhost:3000/health
- Conta: `gestor@local` / `gestor`

A API lê `DATABASE_URL` do `.env`. Na entrada ela roda `prisma migrate deploy`. Sem `DATABASE_URL` e `SESSION_SECRET` ela não sobe.

Postgres local é opcional, no profile `local-db`:

```bash
docker compose --profile local-db up --build
```

`IMAGE_TARGET=development` troca o alvo da imagem (watch na API, Vite na web). O `web` continua na frente da API.

## O que esta versão faz

1. Monorepo pnpm: `apps/api`, `apps/web`, `packages/shared`, Compose.
2. Uma conta gestor, cookie de sessão.
3. Login, sidebar, tema claro/escuro em `data-theme`.
4. Fábricas, máquinas (linha de GD e apadrinhada), seis funções só leitura, técnicos sem login. Excluir fábrica com máquina é recusado.
5. Captura de Tarefa, Feedback e Problema (texto, tipo, quando, técnico se souber).
6. Ficha da Tarefa (prazo, prioridade, status, observação, fábrica, TAG, linha, anexo), do Feedback (alvo) e do Problema (máquina ou outra).

## Fora desta versão

Acompanhamento com filtros de prazo, chamado e ocorrência de turno, card do dashboard e o fechamento das fatias 7 a 10.
