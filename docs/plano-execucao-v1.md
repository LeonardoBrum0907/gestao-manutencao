---
cursor:
  subagentId: "bc-d5b0e70a-00dd-5442-a3d8-b2ca26ffb198"
---

# Plano de execução — v1

Para o Leonardo Brum. Documento executável: o que construir, em que ordem, e o que fica de fora. Não é implementação.

Norte: [project-context.md](project-context.md). Corte: [lista-mvp-sigem.md](lista-mvp-sigem.md). Modularização React: [Juntao Qiu / Martin Fowler](https://martinfowler.com/articles/modularizing-react-apps.html) — view fina, domínio fora do componente, pastas por domínio.

---

## 1. Objetivo / fora de escopo

### Objetivo

O gestor anota rápido no celular e organiza no computador, numa fonte só.

Três tipos de registro:

| Tipo | Nome dele | O que é |
|---|---|---|
| Tarefa | Pendências do dia a dia | Algo a executar. Campos de ação moram aqui (não há módulo Plano de ação). |
| Feedback | Pessoas | Observação sobre pessoa / comportamento / desempenho. |
| Problema | Pendências Preventivas | Falha, ocorrência ou pendência de equipamento/processo. Chamado e ocorrência do GD nascem como este tipo. |

Cada registro nasce mínimo (texto, tipo, quando, quem se souber) e pode ganhar detalhe depois. Acompanhar = uma lista por status, prazo e tipo.

Só o gestor usa. Técnico, máquina e fábrica são etiqueta / cadastro de apoio — sem login de técnico.

### Entra na v1

O que está `[x]` no bloco **Registros**, mais o apoio `[x]` sem o qual o registro fica solto, mais os órfãos **Chamado** e **Fábricas**, com os cortes do Leonardo:

- Captura rápida e acompanhamento (lista do aberto).
- Tarefa com os campos da ação: responsáveis, prazo, prioridade, status, observação; contexto fábrica / TAG / linha; anexo na tarefa (o `[x]` de foto/anexo da ação).
- Feedback com alvo = técnico (etiqueta).
- Problema; chamado (nº do dia, descrição, horários, duração, técnicos, máquina ou “outra”, status, observação) e ocorrência do GD (texto + fábrica + linha) como *origem* do Problema — não como telas CMMS.
- Cadastros: fábricas; máquinas (nome, fábrica, setor, fabricante, código interno, status, observações); funções do técnico (as 6 do SIGEM); técnicos (nome, função, turno, área como texto, status, matrícula, contato, observações). Flags da máquina que já estão `[x]`: linha de GD e apadrinhada — só o campo, sem tela de apadrinhamento.
- Dashboard: **um card** cujo número vem da fonte dos registros (abertos). Sem rankings, atalhos, relatório do dia ou PDF.
- Atrasos como *filtro da lista*: vencidas, hoje, amanhã. Bloqueadas / “impactam entrega” ficam de fora (módulo de entrega não entra).
- Visual SIGEM (sidebar clara, cards, tipografia, cores) com tema selecionável.
- Uma conta gestor. Mesmo app React no celular (responsivo).

### Fora de escopo

Não copiar o SIGEM. Não inventar o que está `[ ]`. O módulo **Plano de ação** (tabela, ID de rastreio, sub-ações, concluir OK/Não OK, Excel, origem rastreável, aplicar RP) **não entra** — só os campos da ação na Tarefa.

Também de fora, mesmo quando o inventário SIGEM está `[x]` como *extra* (reunião, RH, envelope, legado):

- Tipo “Outros registros”.
- Áreas / setores e tipos de atividade como cadastro (texto na ficha basta).
- Relatório de corretivas do turno, vincular RP ao chamado, diário de preventiva executada, Ishikawa, causa-raiz + duas contramedidas, ver RPs no GD.
- Ficha RP 4M / WhatsApp / aviso de duplicado / relatório de RPs / tela de apadrinhamento.
- Dashboard cheio, Relatório do Dia, Relatório de período, indicador de evolução, PDFs.
- Avaliação, PDI, análise individual do técnico.
- Gerar pendência a partir de chamado/ocorrência, fotos no chamado, aviso ao entrar, backlog, inspeções, AGMT, entrega de máquina, PWA, offline, IA, licença.

Voz no app próprio fica para depois. Todoist/Ramble não alimentam este sistema.

---

## 2. Arquitetura e pastas

**Premissa:** repositório novo (monólito de repo). Backend e frontend em apps separados. TypeScript nos dois lados.

```
/
  apps/
    api/                 NestJS (recomendado)
    web/                 React + TanStack Query + Tailwind
  packages/
    shared/              tipos e enums compartilhados (opcional no dia 1)
  docker-compose.yml     api, web, db — o mesmo desenho em qualquer ambiente
  package.json           pnpm workspace
```

### Backend — NestJS (recomendação)

Módulo Nest = bounded context. Casa com DDD e SOLID: um contexto, um módulo, um conjunto de casos de uso. Camadas por módulo: `domain` (entidades, value objects, regras), `application` (use cases), `infra` (Prisma), `http` (controllers). O módulo não importa o `domain` de outro — fala por ID e por tipos de `packages/shared`.

**Alternativa mais magra:** Fastify sem Nest. Mesmos bounded contexts viram pastas (`cadastro/`, `registro/`, `turno/`, `dashboard/`), mesmos casos de uso, menos cerimônia. Só vale se o time quiser menos framework; o plano assume Nest.

Persistência: **Prisma + Postgres** no Compose. A API não sobe sem `DATABASE_URL`.

### Frontend — React

React é a view. TanStack Query é o cache de servidor (camada de dados). Tailwind consome tokens CSS, não hex solto. Shell (login, sidebar, tema) fica fora dos módulos de domínio.

### Por que não um app só

Captura no celular e lista no computador são o mesmo produto, duas larguras. Separar api/web deixa o domínio no servidor (fonte da verdade) e o React trocável. Compose iguala dev e deploy.

---

## 3. Como modularizar

### React — por domínio, não por tipo de arquivo

O artigo do Fowler: não existe “aplicação React”; existe front com React na view. O erro clássico é `components/`, `hooks/`, `services/` no topo e regra de negócio dentro de `useEffect`. A evolução que ele descreve: componente único → vários componentes → hooks → objetos de domínio → camadas Presentation / Domain / Data.

Nesta v1 o topo de `apps/web/src` é o **contexto**, não o tipo de arquivo:

```
apps/web/src/
  app/                      rotas, providers (Query, tema)
  shell/                    login, sidebar clara, layout, seletor de tema
  design/                   tokens CSS, primitives (Button, Card, Input)
  modules/
    cadastro/               fábrica, máquina, função, técnico
    registro/               captura, ficha, lista de acompanhamento
    turno/                  chamado e ocorrência (nascem Problema)
    dashboard/              o card com fonte
```

Dentro de cada módulo, camadas do Fowler — não pastas globais `hooks/` e `components/`:

| Camada | Pasta no módulo | O que faz |
|---|---|---|
| View | `ui/` | JSX fino. Sem `fetch`, sem regra de prazo/status. |
| Domain | `model/` | Tipos, mapeamento DTO → modelo, regras (vencida, aberto, rótulo do tipo). Sem React. |
| Data | `data/` | Cliente HTTP + hooks TanStack Query. Gateway: um lugar para mudar o contrato da API. |

Regra prática: se o código roda sem React, não está em `ui/`. Query key e invalidação moram no módulo dono do recurso. `registro` lista tarefas, feedbacks e problemas; `turno` só cria/edita chamado e ocorrência e invalida `registro`.

Não extrair “design patterns” no vazio — o artigo só introduz Strategy / polimorfismo quando a variação aparece. Na v1 a variação real é o *tipo* do registro (três formulários de detalhe, uma captura, uma lista).

### Nest — módulo = bounded context

```
apps/api/src/
  cadastro/          fábrica, máquina, função, técnico
  registro/          tarefa, feedback, problema, captura, lista
  turno/             chamado, ocorrência → criam/atualizam Problema em registro
  dashboard/         leitura: um card, uma fonte
  identity/          uma conta gestor (session/cookie)
```

- **Cadastro** — CRUD de apoio. Técnico sem senha. Funções: as 6 fixas (mecânico, eletricista, automação, instrumentação, manutenção, utilidades).
- **Registro** — agregado `Registro` com tipo. Tarefa carrega os campos da ação. Lista de acompanhamento e filtros de atraso (prazo) saem daqui.
- **Turno** — caso de uso “abrir chamado” e “anotar ocorrência”. Persiste como Problema (origem `chamado` | `ocorrencia`). Sem envelope de relatório de turno, sem Ishikawa, sem “gerar pendência”.
- **Dashboard** — query de leitura sobre a tabela de registros (contagem do aberto). Não tem escrita própria.

Turno depende de Registro pela aplicação (porta / serviço), não pelo Prisma do outro módulo. Cadastro é referenciado por ID.

---

## 4. Temas

Visual de partida = SIGEM (sidebar clara, cards, tipografia, paleta). Não hardcoded no JSX.

1. Extrair do artefato SIGEM as cores, raios, sombras e pesos de fonte para **variáveis CSS** (`--bg`, `--surface`, `--text`, `--border`, `--accent`, `--sidebar-bg`, `--card-bg`, …).
2. Dois temas na v1: `light` (default, o “SIGEM claro”) e `dark`. O seletor aceita outros nomes: `[data-theme="…"]` no `html` é o único gancho.
3. Tailwind lê os tokens (`bg-surface`, `text-app`, `border-app`). Proibido hex/rgb em componente de tela.
4. Persistência: `localStorage` da escolha do gestor + cookie/atributo no documento para evitar flash. Uma chave, um valor (`light` | `dark` | futuro).
5. Troca no shell (sidebar ou login), sem recarregar. Sem tema por técnico — só o gestor usa.

Estender um terceiro tema = novo bloco `[data-theme="nome"]` no CSS. Zero mudança de tela.

---

## 5. Modelo de dados mínimo

Postgres. Nomes em português de domínio; persistência em inglês estável.

### Apoio (Cadastro)

**Factory** — nome. Print de contexto (F1–F3, Flexografia, Manipulação, Oncológico) é dado, não módulo.

**Machine** — nome, `factoryId`, setor (texto), fabricante, código interno, status operacional (texto controlado do cadastro SIGEM: Em Implantação / Em Teste / Em Ajuste / Liberada / Parada / Finalizada — já está no `[x]` de máquinas), observações, `isDailyLine` (linha GD), `isCritical` (apadrinhada). Sem tela de situação/liberação.

**TechnicianRole** — as 6 funções. Seed, não cadastro aberto.

**Technician** — nome, `roleId`, turno (1º / 2º / 3º / Administrativo), área (texto), status (Ativo / Inativo / Férias / Afastado), matrícula, contato, observações. Sem login.

### Identidade

**User** — uma linha: email/login + hash da senha do gestor. Sem papéis.

### Registro (fonte da verdade)

**Record**

| Campo | Uso |
|---|---|
| `type` | `task` \| `feedback` \| `problem` |
| `body` | texto da captura |
| `occurredAt` | quando |
| `status` | aberto / em andamento / concluído (vocabulário mínimo; detalhe depois) |
| `technicianId` | quem, se souber (responsável da tarefa, alvo do feedback, nome no problema) |
| `factoryId` | contexto |
| `machineId` | ou nulo |
| `machineLabel` | texto “outra” quando não há cadastro |
| `tag` | texto, contexto da ação |
| `line` | texto, contexto da ação |
| `priority` | só Tarefa |
| `dueAt` | só Tarefa |
| `notes` | observação da ação / chamado |
| `origin` | `inbox` \| `chamado` \| `ocorrencia` |
| `dayNumber` | nº do dia (chamado) |
| `openedAt` / `closedAt` / `durationMin` | horários do chamado |
| `createdAt` / `updatedAt` | auditoria mínima |

**RecordAttachment** — arquivo da Tarefa (o `[x]` de anexo da ação). Sem anexo de chamado.

Índices: `type+status`, `dueAt` (lista e filtros de atraso), `origin` (turno). Sem tabela de plano de ação, sem RP, sem sub-ação.

Dashboard lê `COUNT(*)` de `Record` com status aberto — essa é a fonte do card.

---

## 6. Fatias de construção (ordem)

Cada fatia deixa o Compose no ar e o gestor com um caminho clicável a mais. Não pular cadastro: sem fábrica/máquina/técnico o “quem” e o “onde” não existem.

1. **Repo e Compose** — workspace pnpm, `apps/api` Nest + Prisma, `apps/web` Vite/React/Tailwind, Postgres no Compose, `/health`, migrate deploy. TypeScript nos dois lados.
2. **Identidade** — uma conta gestor, cookie de sessão (HTTP no Compose/dev). Sem isso não há “só o gestor”.
3. **Shell e tokens** — login, sidebar clara, layout responsivo (lista no desktop, captura no celular), `data-theme` light/dark persistido. Primitives no token, não no hex.
4. **Cadastro** — fábricas → máquinas (com as duas flags) → funções seed → técnicos. CRUD do gestor.
5. **Registro mínimo** — criar os três tipos pela captura (texto, tipo, quando, quem se souber). Persistência `Record`. Sem os campos extras ainda.
6. **Ficha e campos da ação** — editar depois: Tarefa (prazo, prioridade, status, observação, fábrica/TAG/linha, anexo); Feedback (alvo); Problema (máquina ou “outra”).
7. **Acompanhamento** — uma lista: filtro tipo, status, prazo; fatias vencida / hoje / amanhã. É a tela de “organizar no computador”.
8. **Turno → Problema** — abrir chamado (campos `[x]` do chamado) e anotar ocorrência (fábrica + linha + texto). Ambos criam `Record` tipo problema com `origin`. Sem relatório de turno e sem tela GD por fábrica.
9. **Dashboard** — uma rota, um card, número = abertos da tabela de registros. Link para a lista. Sem ranking.
10. **Fechamento v1** — migrate no Compose de deploy, tema sobrevive ao F5, captura no viewport estreito, lista no largo, critério da seção 9 verde.

---

## 7. Compose (dev e deploy)

O mesmo `docker-compose.yml` para qualquer ambiente. Três serviços:

| Serviço | Papel |
|---|---|
| `db` | Postgres. Volume nomeado. Healthcheck antes da API. |
| `api` | Nest. `DATABASE_URL`, `JWT_SECRET` (ou equivalente de sessão). Migrate na entrada (`prisma migrate deploy`). Porta interna atrás do web ou publicada. |
| `web` | Build estático do React ou Vite. Em dev, proxy `/api` → api (cookie same-origin). Em deploy, o mesmo proxy (nginx no container web ou um reverse proxy na frente). |

Regras:

- Dev e deploy não trocam de topologia — só de env e de `target` da imagem (hot-reload vs build).
- A API recusa boot sem `DATABASE_URL` e segredo de sessão.
- Rede interna Compose; o navegador fala com `web`.
- Sem serviço Pluggy, IA ou worker na v1.
- Profile extra de Postgres local só se não houver URL remota — o desenho continua `api + web + db`.

---

## 8. Padrões de código

- **SOLID** — um caso de uso, uma razão para mudar. Controller fino. Query do dashboard não mora no CRUD de registro. Tema não conhece domínio.
- **DDD** — bounded contexts = módulos Nest e pastas React da seção 3. Agregado `Record`. IDs para atravessar contexto. Ubiquitous language: Tarefa, Feedback, Problema, Chamado, Fábrica — não “item”, “ticket”, “entity”.
- **Clean Code** — nomes que dizem o tipo e a ação. Funções curtas. Sem comentários no código (quando formos implementar). Sem `TODO` no lugar de fatia. Sem código morto do SIGEM.
- **Fowler no front** — view sem fetch; modelo sem JSX; TanStack Query no `data/` do módulo. Sem `useEffect` + `fetch` na tela.
- **Tokens** — cor, espaçamento e tipografia só por CSS variable / classe Tailwind de token.
- **Teste o que é regra** — vencida / hoje / amanhã; captura mínima inválida; chamado vira problema. Não testar o Prisma inteiro em cada tela.

---

## 9. Critério de pronto

A v1 está pronta quando o gestor, sozinho, consegue:

1. Entrar com a conta única.
2. Cadastrar fábrica, máquina e técnico (e ver função).
3. No viewport de celular: capturar texto como Tarefa, Feedback ou Problema e gravar.
4. No computador: abrir a lista, filtrar por tipo/status/prazo (incluindo vencida/hoje/amanhã) e completar prazo, responsável e observação numa Tarefa.
5. Abrir um chamado e uma ocorrência e vê-los na lista como Problema.
6. Ver o card do dashboard com a contagem de abertos igual à lista.
7. Trocar light/dark, recarregar, permanecer no tema.
8. Subir `api + web + db` com um `docker compose up` e persistir no Postgres.

Pronto **não** inclui: PDF, PWA, voz, segundo usuário, plano de ação em tabela, GD como reunião, avaliação de técnico, ranking no dashboard.

---

## 10. Premissas

Marcado como premissa — não é decisão inventada neste plano.

| Premissa | O que significa |
|---|---|
| **Repo novo** | Este produto não nasce dentro do HTML do SIGEM nem de outro app do workspace. Monólito de repositório, apps separados. |
| **Captura no celular = o mesmo app React responsivo** | Não há app nativo, PWA obrigatório nem front paralelo. Celular e computador são breakpoints. |
| **Auth = uma conta gestor** | Sem papel de técnico, sem convite, sem multi-empresa. Técnico é dado. |
| **Postgres** | Fonte da verdade no `db` do Compose. Sem localStorage como banco (o SIGEM atual não é o modelo). |

Decisões já tomadas (Leonardo), não premissas: monólito + Compose; TypeScript; React + TanStack Query + Tailwind; tokens + tema selecionável; Nest recomendado (Fastify = alternativa magra); Prisma; SOLID/DDD/Clean Code sem comentários; escopo = `[x]` de Registros + órfãos Chamado/Fábricas + campos da ação na Tarefa; dashboard só o card com fonte; só o gestor.
