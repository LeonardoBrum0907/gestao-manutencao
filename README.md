# Gestão de Manutenção

Caderno do gestor: captura, acompanhamento, turno e dashboard.

## Subir

Copie `.env.example` para `.env`. Preencha `DATABASE_URL` com o Postgres da VPS (banco `manutencao`) e `SESSION_SECRET`. O `.env` fica de fora do Git.

```bash
docker compose up --build
```

O comando padrão sobe só `web` e `api`. O Postgres local não entra.

- App: http://localhost:8080
- O `web` encaminha `/api` e `/health` para a `api`
- Saúde: http://localhost:8080/health e http://localhost:3000/health
- Conta: `gestor@local` / `gestor`

A API recusa o boot sem `DATABASE_URL` e `SESSION_SECRET`. Na entrada ela roda `prisma migrate deploy` e só então escuta na porta 3000. O `web` espera essa saúde antes de publicar a porta 8080.

### Postgres local

Só com o profile `local-db`. Nesse caso o `DATABASE_URL` do `.env` aponta para o host `db`, porta `5432`, com o usuário, a senha e o banco do serviço `db`.

```bash
docker compose --profile local-db up --build
```

`IMAGE_TARGET=development` troca o alvo da imagem (watch na API, Vite na web). O `web` continua na frente da API.

## O que esta versão faz

1. Monorepo pnpm: `apps/api`, `apps/web`, `packages/shared`, Compose.
2. Uma conta gestor, cookie de sessão.
3. Login, sidebar, tema claro/escuro em `data-theme`.
4. Fábricas, máquinas (linha de GD e apadrinhada), funções (as seis do SIGEM como seed, com criar e renomear), técnicos sem login. Cadastro em modal. Excluir fábrica com máquina é recusado.
5. Captura de Tarefa, Feedback e Problema (texto, tipo, quando, técnico se souber).
6. Ficha da Tarefa (prazo, prioridade, status, observação, fábrica, TAG, linha, anexo), do Feedback (alvo) e do Problema (máquina ou outra).
7. Lista de acompanhamento em `/acompanhamento`, com filtros de tipo, status e prazo (vencida, hoje, amanhã).
8. Chamado em `/turno/chamado` e ocorrência em `/turno/ocorrencia`, gravados como Problema.
9. Dashboard em `/dashboard`: abertas, vencidas, vencem hoje e concluídas (cada card abre a lista filtrada), máquinas, técnicos ativos, últimos registros e ranking de máquinas e técnicos com mais abertos.

## Fora desta versão

Relatório do dia, PDF, Ishikawa, relatório de turno, gerar pendência e PWA.

## Planejamento

Os documentos que guiaram esta versão ficam em `docs/`:

- [project-context.md](docs/project-context.md) — o norte: a dor do gestor e os três tipos de registro.
- [lista-mvp-sigem.md](docs/lista-mvp-sigem.md) — o corte do MVP, item a item do SIGEM.
- [plano-execucao-v1.md](docs/plano-execucao-v1.md) — arquitetura, fatias de construção e critério de pronto.
- [melhorias-ux-v1.md](docs/melhorias-ux-v1.md) — checklist de UX/UI sobre as telas da v1.
- [analise-sigem.md](docs/analise-sigem.md) e [sigem-nao-mapeado.md](docs/sigem-nao-mapeado.md) — levantamento do SIGEM usado como referência de domínio.
- [todoist-como-entrada.md](docs/todoist-como-entrada.md) — estudo do Todoist como canal de captura (fora do MVP).
