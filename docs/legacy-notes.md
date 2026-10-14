# Notas do código legado

Refatorações em andamento e armadilhas conhecidas (regra em `AGENTS.md`).

## Rotas da API sem tela (2026-10-14)

Com Meu Dia, Agenda e Registros no lugar das abas antigas de Registros, o web deixou de chamar:

- `GET /api/records/board/problems` e `GET /api/records/board/feedbacks` (checklists antigos de Problemas e Feedbacks; a tela Registros lê `GET /api/records`);
- `GET /api/dashboard/overdue-count` (selo de atrasadas no menu, removido a pedido do Léo: o Meu Dia já tem a seção Atrasadas).

Ficaram na API porque são rotas públicas (o `AGENTS.md` pede para perguntar antes de mexer) e algum cliente externo, como o conector MCP, pode usá-las. Antes de removê-las, confira o MCP em `apps/api/src/mcp`.
