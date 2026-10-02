# Todoist como canal de entrada do sistema próprio

Para o Leonardo Brum. Pergunta: dá para o encarregado, no celular, falar ou digitar rápido no Todoist (com Ramble) e isso virar GD, chamado, pendência ou backlog no sistema de manutenção?

**Veredito:** serve como **caixa de entrada rápida**. Não serve como CMMS, nem como ficha do turno. A API e os webhooks **empurram tarefa genérica** para o nosso sistema. O MCP oficial **não** é esse cano: ele deixa um assistente de IA operar *dentro* do Todoist. Ishikawa 6M, máquina cadastrada, turno, causa-raiz, duas contramedidas, fotos de chamado e relatório de N chamados **não cabem** numa tarefa.

---

## Fontes (setembro 2026)

| Fonte | O que cobre |
|---|---|
| [developer.todoist.com](https://developer.todoist.com/) e [API v1](https://developer.todoist.com/api/v1/) | API unificada, OAuth, Sync, webhooks, limites de request |
| [Doist/todoist-mcp](https://github.com/Doist/todoist-mcp) + MCP hospedado `https://ai.todoist.net/mcp` | MCP oficial |
| [Ramble — help](https://www.todoist.com/help/todoist/todoist-and-ai/dictate-to-add-tasks-with-ramble-P1Raq7vVF) (atualizado 18 set 2026) | Voz → tarefas |
| [Limites de uso](https://www.todoist.com/help/todoist/get-started/usage-limits-in-todoist-e5rcSY) e [preços](https://www.todoist.com/help/todoist/billing/todoist-plans-pricing-and-billing-faq-Vq2z0HWL6) | Plano, Ramble, tetos |
| TechCrunch (21 jan 2026) + [Google Cloud / Doist](https://cloud.google.com/blog/topics/startups/the-blueprint-doist-stream-of-consciousness-ai-task-list-creation) | Ramble usa Gemini Flash Live (Vertex AI); áudio não fica gravado |

Context7 MCP foi tentado e recusou por cota mensal; a pesquisa foi nas docs oficiais e na web.

Nada abaixo é implementação. Onde o produto Todoist não fecha com o chão da planta, está **inferência**.

---

## 1. O modelo, em linguagem de gestor

Todoist é lista de coisas a fazer, não ordem de serviço.

| Peça | O que é, na prática |
|---|---|
| **Inbox** | Caixa de entrada. Tarefa sem projeto cai aqui. No Wear OS, o Ramble **só** manda para a Inbox. |
| **Projeto** | Pasta. Pessoal (até 5 pessoas) ou de time (Business). Não é fábrica, não é linha. |
| **Seção** | Faixa dentro do projeto (ex.: “Hoje”, “Aguardando peça”). Máximo **20 por projeto**. |
| **Tarefa** | Título (até 500 caracteres) + descrição + prazo + prioridade 1–4 + labels + responsável (só em projeto compartilhado) + subtarefa de **um** nível. |
| **Label** | Etiqueta solta (`@turno1`, `@CAM5`). Até 100 por tarefa, 500 na conta. Não é cadastro de máquina. |
| **Comentário** | Texto extra. **Um anexo por comentário**. Foto de chamado no SIGEM atual é outro mundo. |
| **Prazo (due)** | Quando a pessoa pretende mexer. Linguagem natural: “amanhã 14h”, “toda terça”. |
| **Deadline** | Data-limite dura. Recurso **pago**. |
| **Prioridade** | Quatro níveis. No app, P1 é o mais urgente; na API o número inverte (P1 do app = `4`). |

**Não existe** campo customizado (máquina, TAG, Ishikawa, status “Aguardando peça”, “impacta entrega”). Quem precisa disso hoje cola no título, na descrição ou inventa label. Fontes independentes (2026) confirmam: o modelo é fixo de propósito.

### Ramble (voz)

Não é um assistente que conversa. É **ditado que vira tarefas enquanto a pessoa fala**.

No celular: ícone de onda no Quick Add (widget, atalho da tela de bloqueio, botão de ação no iPhone, tile no Android). Fala. Vê um preview. Diz “na verdade…” para corrigir, “remove isso” para apagar, “é só” para gravar.

Pega do falado: nome, descrição, data/hora, projeto, prioridade, seção, label, deadline e duração (estes dois, plano pago). **Não pega:** subtarefa, lembrete customizado.

Português está na lista (~40 idiomas). Precisa de **internet**. Plano grátis: **10 sessões/mês** (contar já ao abrir o microfone, mesmo sem gravar). Pro/Business: ilimitado, com rate limit raro. No chão de fábrica barulhento a transcrição piora — a própria Doist pede falar mais perto e pausar entre itens.

Por baixo: Todoist Assist + Gemini Flash Live (Vertex AI). A Doist diz que o áudio não é armazenado nem usado para treinar modelo; o que fica é a tarefa. **Inferência:** para planta farma isso ainda é dado operacional saindo para nuvem alheia (Doist + Google). SOC2 Type II do Todoist **não** é 21 CFR Part 11.

---

## 2. O que a API e o MCP permitem de verdade

API **gratuita** com qualquer conta. Base atual: `https://api.todoist.com/api/v1` (REST unificada). Apps nativos usam também o endpoint `/sync` (vários comandos num request).

### Autenticação

- **Token pessoal:** Ajustes → Integrações → Desenvolvedor. Serve para um usuário (o Leonardo, ou uma conta “robô”).
- **OAuth 2.0:** app registrado, scopes `task:add`, `data:read`, `data:read_write`, `data:delete`, `project:delete`. Apps novos devolvem `access_token` (~1 h) + `refresh_token`.
- Webhook **só dispara depois do OAuth** daquele usuário. A conta que criou o app **não** recebe evento até completar o fluxo OAuth nela mesma.

### REST / Sync — o que dá

| Ação | Dá? |
|---|---|
| Criar, ler, atualizar, apagar tarefa | Sim |
| Fechar / reabrir | Sim (`close` / `reopen`) |
| Mover de projeto/seção | Sim (comando próprio, não o update comum) |
| Quick Add (texto tipo “CAM5 parou hoje p1 #GD @1turno”) | Sim (`POST /api/v1/tasks/quick`) |
| Projetos, seções, labels, comentários | Sim |
| Upload de arquivo e anexo no comentário | Sim, teto do plano |
| Filtrar tarefas (query Todoist) | Sim (`/api/v1/tasks/filter`) |
| Tarefas concluídas (paginado) | Sim |
| Campo “máquina” / “turno” / Ishikawa | **Não** |
| Webhook de “nova tarefa” para o nosso servidor | **Sim** (ver abaixo) |

### Webhooks — o cano certo para o nosso sistema

Configura URL **HTTPS sem porta** no console do app. Todoist faz POST JSON assinado (`X-Todoist-Hmac-SHA256`, HMAC-SHA256 do body com o `client_secret`). Deduplicar com `X-Todoist-Delivery-ID` (retry reusa o mesmo id).

Eventos úteis: `item:added`, `item:updated`, `item:completed`, `item:deleted`, `item:uncompleted`, comentários, projetos, seções, labels. Payload traz a tarefa (`content`, `description`, `due`, `labels`, `project_id`, `priority`, `responsible_uid`, …).

Regras duras da Doist:

- Responder **HTTP 200**. Outro código = falha; tenta de novo em 15 min, **no máximo 3 vezes**.
- Evento pode atrasar, chegar fora de ordem ou **não chegar**. Webhook é aviso, não fonte da verdade — o nosso sistema precisa saber reler a API.
- Não substitui cadastro nosso.

### Limites (oficiais)

| Limite | Valor |
|---|---|
| Tarefas **ativas** por projeto (subtarefa e recorrente contam) | **300** — todos os planos, **sem upgrade** |
| Seções / projeto | 20 |
| Labels / conta | 500 |
| Anexo | 1 por comentário; 5 MB (grátis) / 25–100 MB (pago) |
| Título / descrição | 500 / ~16 mil caracteres |
| Sync: requests parciais / 15 min | 1000 por usuário |
| Sync: full sync / 15 min | 100 por usuário |
| Comandos por request Sync | 100 |
| REST paginação | `limit` default 50, máx. 200 |
| Body POST | 1 MiB |
| HTTP 429 | rate limit; há `retry_after` |

**Inferência:** um POST REST por tarefa nova, no volume de um turno, não estoura 1000/15 min. Estoura o **300 ativas no mesmo projeto** se o Inbox de captura não for esvaziado (tarefa ingerida no SIGEM deveria ser concluída ou movida).

**Terceiros** ainda citam “1000 REST / 15 min” da API v2 antiga. A doc v1 que lemos detalha o teto no **Sync**. Em 429, backoff — não inventar o número REST como fato atual.

### O que **não** dá

- Custom fields, lookup de máquina, enum de status do SIGEM, Ishikawa, duas contramedidas, “concluir sem eficácia”, “impacta entrega”.
- Foto como campo da tarefa (só comentário, 1 arquivo).
- Relatório de turno com N chamados numa entidade só.
- Idempotência de negócio (a API não sabe se aquela OS já entrou no SIGEM).
- Webhook sem HTTPS público.
- Usar o Todoist **offline** e ter o webhook na hora — o sync sobe quando volta a rede; o Ramble **nem abre** offline.

### MCP oficial — existe, mas não alimenta o SIGEM

Existe MCP **oficial** da Doist:

- Repo: `Doist/todoist-mcp` (npm `@doist/todoist-mcp`)
- Hospedado: `https://ai.todoist.net/mcp` (OAuth no browser)
- Local: `npx @doist/todoist-mcp` com `TODOIST_API_KEY`

Tools (não é lista fechada para sempre; o README manda olhar `src/tools`): `add-tasks`, `update-tasks`, `complete-tasks`, `find-tasks`, `find-tasks-by-date`, projetos/seções/labels/comentários, `search`/`fetch` no formato OpenAI, overview, atribuições, etc.

MCP é **o contrário do que o Leonardo perguntou**: um agente (Cursor, Claude, ChatGPT) lê e escreve **no Todoist**. Não há ferramenta “envie esta tarefa para o CMMS”. Para empurrar ao sistema próprio o caminho é **webhook + REST**, não MCP.

**Inferência:** MCP só faria sentido depois, se um assistente interno do SIGEM quisesse *consultar* o Todoist. Não é canal de captura do turno.

---

## 3. Mapa: o que alimenta o nosso domínio

Referência mental: GD, corretiva de turno, plano de ação, backlog semanal — o que o SIGEM atual já opera. Uma tarefa Todoist ≈ título + prazo + label + pessoa.

| Destino no nosso sistema | O que o Todoist consegue carregar | O que **não** cabe e tem de nascer no SIGEM |
|---|---|---|
| **GD (ocorrência na linha)** | Texto do problema, data (due), “turno” e “linha” se virarem label ou prefixo no título (`[F2 CAM5] [1T]`) | Ishikawa 6M (6 listas), causa-raiz, ação definida, status Em análise / Ação definida / Resolvido, vínculo `idMaq` de verdade, gerar pendência com rastreio |
| **Corretiva / chamado** | Um chamado avulso: descrição, hora aproximada no due, técnicos se o projeto for compartilhado | Relatório de turno (data + supervisor + **N** chamados), nº que reinicia no dia, hora abertura/fechamento/duração, máquina “outra”, fotos, flag “gerar pendência”, vincular RP |
| **Pendência / plano de ação** | Título do problema, responsável, prazo, prioridade, origem grosseira (`@gd` / `@corretiva`) | `idAcao`, causa-raiz + contramedida corretiva + preventiva, sub-ações e %, OK vs Não OK, fábrica/TAG/linha, bloqueio, “impacta entrega”, anexos na ação, origem rastreável `origemId` |
| **Backlog semanal** | OS no título, técnico, prazo (combinar “terça”), atividade no texto | Semana ISO, cadastro rápido só técnico+OS com regra nossa, atraso em dias, vínculo com OS de planta |
| **Preventiva feita no turno** | “Fiz preventiva CAM4” como tarefa | Agrupar por data+turno, status Pendente/Em andamento/Concluída, máquina como string vs cadastro |
| **RP** | Colar um bloco na descrição | Parser WhatsApp, 4M, falha repetida, aplicar ao plano (+7 dias) |
| **AGMT / inspeção / apadrinhamento / avaliação de técnico** | No máximo um lembrete | Modelo inteiro é outro |

**Cabe como rascunho.** **Não cabe como registro oficial.** O SIGEM precisa de um estado “captura bruta / a classificar” e um humano (ou regra) que complete máquina, turno, 6M e destino.

Convenção possível **se** for usar (proposta, não fato do Todoist):

- Um projeto `SIGEM-Captura` (esvaziar sempre; teto 300 ativas).
- Seções: `GD` · `Chamado` · `Pendencia` · `Backlog` — o Ramble só acerta seção se a pessoa **falar o nome** ou estiver *dentro* da seção.
- Labels curtas: `@1t` `@2t` `@3t` `@gd` `@os`. **Não** criar um label por máquina: explode o teto e o Ramble erra nome (`Uhlmann` vs `UHL1`).
- Título: `[LINHA] texto livre`. O nosso parser lê o colchete; o resto fica descrição.

Isso é disciplina de gente, não garantia de software.

---

## 4. Fluxos no celular

### A. O fluxo que o Leonardo imaginou (o mais rápido)

```
Widget Ramble (tela de bloqueio)
  → fala 20–40 s no corredor da linha
  → preview de 1–N tarefas
  → “é só”
  → tarefas no projeto/Inbox
  → webhook item:added  (quando houver rede)
  → nosso backend cria rascunho (GD ou pendência, conforme seção/label)
  → no posto / no SIGEM, o supervisor completa máquina, 6M, fotos
```

Ramble **não** funciona offline. No 3º turno com Wi-Fi ruim, esse fluxo morre. Aí vale o B.

### B. Digitar sem IA (mais robusto no chão)

Quick Add do app (funciona **offline** no app nativo; sobe no sync):

`[CAM5] esteira parou @1t p1 #SIGEM-Captura`

Webhook ou job de sync puxa quando a nuvem receber. Mesmo payload. Sem cota de 10 sessões.

### C. Só Inbox, classificar depois

Fala/digita qualquer coisa. Tudo cai na Inbox. No SIGEM, fila “Capturas do Todoist” com botões: virar GD / virar chamado / virar pendência / descartar. Menos magia, menos erro. **Inferência:** é o desenho que sobrevive ao primeiro mês.

### D. O que **não** fazer

- Tratar o Todoist como o plano de ação (duas fontes da verdade; atraso e dashboard mentem).
- Completar a tarefa no Todoist **e** no SIGEM sem regra: duplicidade ou “sumiu do atraso”.
- Mandar o time todo criar conta pessoal e compartilhar projeto grátis (máx. 5 pessoas no projeto pessoal; time de verdade pede Business).
- Achar que MCP no Cursor “já integra”. Integra o **desenvolvedor** ao Todoist, não o turno ao SIGEM.

### Estado depois da ingestão (precisa decidir)

1. Tarefa no Todoist **concluída** automaticamente (some da Inbox, libera o teto de 300).  
2. Ou label `@no-sigem` e fica lá como espelho.  

**Inferência:** (1) é o certo para captura. Espelho bidirecional vira projeto de integração, não atalho.

---

## 5. Riscos

**Duplicidade.** Webhook retried (mesmo `Delivery-ID` — o nosso lado **tem** de gravar). Pessoa fala duas vezes no Ramble. Pessoa cria no Todoist e no SIGEM. RP e GD gerando a mesma pendência depois. Sem `todoistTaskId` único no nosso banco, isso vaza para o Relatório do Dia.

**Campos estruturados.** Ishikawa, máquina, turno, TAG, “impacta entrega” não existem. Label e regex no título quebram no primeiro apelido de linha (`MED-1` vs `MED1`). O Ramble inventa prioridade e data com confiança demais.

**Offline.** App nativo: criar/editar/concluir offline, sync depois. Ramble: **online obrigatório**. Webhook: só depois do sync na nuvem. Planta com blindagem de sinal = captura por texto, não por voz.

**Multi-usuário.** Projeto pessoal: 5 colaboradores. Time Business: até 250 no projeto, papéis admin/membro/convidado. Sem Business, ou todo mundo usa **uma** conta (auditoria zero: não se sabe quem falou) ou cada um tem Inbox próprio e o OAuth tem de ser por pessoa. O SIGEM atual é posto único; o Todoist puxa para conta na nuvem. São modelos opostos.

**Licença / custo** (FAQ Doist, set 2026; valores em USD; BRL oscila):

| Plano | Preço | Ramble | Encaixa? |
|---|---|---|---|
| Beginner (grátis) | 0 | 10 sessões/mês | Prova de conceito do Leonardo sozinho. Estoura no primeiro turno de verdade. 5 projetos pessoais. |
| Pro | US$ 7/mês ou 60/ano | Ilimitado | Uma pessoa (ele). Não é time. |
| Business | US$ 10/usuário/mês ou 8/mês no anual | Ilimitado + workspace | Time compartilhando `SIGEM-Captura`. |

API em si não cobra. Cobra a **conta** de quem captura. 8 pessoas no 1º turno em Business anual ≈ US$ 96/pessoa/ano — para um Inbox. **Inferência:** caro demais se a única função for “falar no corredor”; barato se o time **já** viver no Todoist. Se não viver, o dinheiro rende mais num Quick Add **dentro** do PWA próprio.

**Dados / planta.** Tarefa com nome de máquina e falha mora no Todoist (e, no Ramble, passa pelo Gemini). Backup JSON do SIGEM atual pelo menos ficava no tablet. Isso é decisão de TI/qualidade, não de app.

**Teto 300.** Se a ingestão falhar um fim de semana, o projeto trava e o Ramble recusa novas tarefas naquele projeto.

**Prioridade e fuso.** API inverte P1. Datas do SIGEM atual já sofrem UTC; somar due do Todoist sem timezone combinado gera “hoje” errado de novo.

---

## 6. Veredito (honesto)

1. **Sim como captura.** App maduro, rápido no bolso, Ramble é o ditado mais simples do mercado, API e webhook **de verdade** para o nosso backend criar rascunho.
2. **Não como CMMS.** Não há 6M, não há relatório de turno, não há plano de ação com eficácia, não há cadastro de máquina, não há foto de chamado decente, não há Relatório do Dia. Quem “tocar a manutenção no Todoist” está tocando lista, não planta.
3. **MCP não é o cano.** O cano é webhook `item:added` + REST para confirmar e concluir a tarefa na origem. MCP é para o agente de desenvolvimento.
4. **Ramble é opcional e frágil no chão** (rede, ruído, 10 sessões no grátis, dado na nuvem). O plano B — Quick Add com `[LINHA]` — é o que deve ser desenhado primeiro.
5. **Só vale a pena** se o Inbox for *descartável*: entra, vira rascunho no SIGEM, tarefa some. No dia em que o plano de ação viver nos dois lados, o atraso e a liberação de máquina mentem.

**Recomendação:** no MVP, **não** depender do Todoist. Colocar captura rápida (texto, depois voz) **no próprio sistema**. Se o Leonardo quiser provar o hábito em uma semana, uma conta Pro + projeto `SIGEM-Captura` + webhook para fila de rascunho é experimento barato — com data para desligar, não arquitetura.
