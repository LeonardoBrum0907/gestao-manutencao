# Análise do SIGEM — pacote completo

Documento de levantamento a partir do artefato recebido por Leonardo Brum. Objetivo: listar funcionalidades e soluções já existentes, para um sistema próprio futuro.

> **Versão analisada:** tela `2026-09-07.1`. Conferido de novo em 2026-10-03 contra o pacote da tela `2026-09-28.3` (arquivos de 30/09). O que essa versão trouxe de novo está em [sigem-nao-mapeado.md](sigem-nao-mapeado.md); os trechos abaixo que mudaram estão marcados com *(2026-09-28.3)*.

**Fontes lidas (pacote completo):**

| Arquivo no pacote | Papel |
|---|---|
| `LEIA-ME.md` | Manual operacional (módulos, GD, sync) |
| `INSTRUCOES.txt` | Instalação, licença, primeiros passos |
| `index.html` | App atual (~9,3 mil linhas + SheetJS 0.18.5) |
| `index_base.html` | Versão anterior (~865 linhas), núcleo “entrega de máquinas” |
| `manifest.json` | PWA (nome, ícones SVG, standalone) |
| `sw.js` | Service worker rede-primeiro |
| `SIGEM.bat` | Atalho Windows: abre `index.html` |

Nada abaixo é inventado. Onde o código/manual não fecha o desenho, está marcado como **inferência**.

---

## 1. Propósito

Há **dois nomes oficiais no próprio pacote** — não é divergência de interpretação:

1. **Acrônimo original** (`index_base.html` + `manifest.json`): **S**istema **I**ntegrado de **G**estão de **E**ntrega de **M**áquinas. Autor no rodapé/login: **dev. AND CC**.
2. **Nome da versão atual** (`LEIA-ME.md` + `INSTRUCOES.txt` + PDFs do `index.html`): **Sistema de Gestão de Manutenção**. O `<title>` do `index.html` atual é só `Sistema` (marca visual da tela de login/sidebar foi esvaziada; as classes CSS `.login-logo` / `.logo-full` continuam).

O produto começou como **controle de pendências para liberar máquina nova/em implantação para produção** (campo “Impacta entrega?”, status `Em Implantação` / `Em Teste` / `Em Ajuste` / `Liberada`). Depois virou **CMMS de turno**: corretivas, preventivas, plano de ação, GD, RPs, backlog, inspeções, AGMT, apadrinhamento, avaliação de técnico.

A versão atual cobre:

- registro de **corretivas** (relatório de turno com vários chamados);
- **preventivas** do dia;
- **plano de ação** (pendências com prazo, causa-raiz, contramedidas, eficácia);
- **ocorrências diárias por linha** com Ishikawa 6M;
- **RPs** (Relatório Padrão de Manutenção, cola de texto estilo WhatsApp);
- **backlog semanal**, **inspeções mensais** e **AGMT** (ordens aguardando material);
- cadastro e **avaliação de técnicos** (comportamento + desempenho trimestral + Pareto);
- situação e **liberação de máquinas**;
- **apadrinhamento** de equipamentos críticos;
- relatórios PDF / período / “relatório do dia”.

Versões gravadas no `index.html`: carimbo da sidebar **`2026-09-07.1`**; constante JS `SIGEM_BUILD='2026-08-02.1'` (os dois números **não coincidem**). O splash canvas também desenha `versão 2026-09-07.1`. *(2026-09-28.3)* O carimbo da sidebar e do splash passa a `2026-09-28.3`; `SIGEM_BUILD` continua `2026-08-02.1`.

**Domínio (agora com evidência no seed da base):** equipamentos de exemplo Marchesini, Hüttlin, Uhlmann; áreas Embalagem / Sólidos / Blister / Compressão / Revestimento; tipos Validação e Processo. Isso sustenta **planta farmacêutica de sólidos/embalagem**, não só uma inferência por nomes de linha CAM/MED/UHL. Não há razão social da fábrica no pacote.

---

## 2. Público

Quem o artefato atende, pelo vocabulário e pelos fluxos:

| Papel no chão | O que o sistema espera que faça |
|---|---|
| Supervisor / encarregado de manutenção | Abre o app no turno, lança corretivas, gera o “Relatório do Dia”, fecha o plano de ação |
| Técnico de manutenção | Aparece como responsável em chamados, pendências, backlog, RPs e preventivas (não há login próprio) |
| Coordenação / gerência | Lê Dashboard, Atrasos, Rel. Período, Apadrinhamento, avaliação de técnicos |
| Fornecedor do sistema (AND CC) | Recebe o código do dispositivo e devolve a chave `SIGEM-XXXX-XXXX-DDMMAA` |

O único “usuário” persistido é o **nome do administrador** (`cfg.admin`, padrão `Administrador`). O botão **Entrar** não pede senha no HTML atual (há CSS residual de `input[type=password]` e constante `AK='sigem_gd_auth_v3'` **não usada** no login).

Na **base**, a senha default `sigem2024` é gravada em `sigem_cfg` e existe UI “Alterar senha de acesso” (`altSenha()`, mínimo 4 caracteres) — mas `doLogin()` **também não valida** a senha. O fluxo de senha nunca chegou a ligar no botão Entrar.

**Inferência:** o app é um **posto único por dispositivo** (sala de manutenção / tablet do turno), não um sistema multi-usuário. A “segurança” operacional é a licença por fingerprint + pasta fixa + “não limpar dados do navegador”, não autenticação de pessoa.

---

## 3. Arquitetura do artefato atual (`index.html`)

- **Um arquivo HTML** autônomo. Sem backend, sem banco SQL.
- Persistência: **localStorage** (`sigem_gd_v3` = dados; `sigem_gd_files_v3` = índice de anexos; `sigem_gd_cfg_v3` = admin; `sigem_gd_licenca_v3` / `sigem_gd_fp_v3` / `sigem_gd_first_v3` = licença/trial).
- Fotos/PDFs: **IndexedDB** `sigem_anexos_v1` (fallback para localStorage ~5 MB). Imagens redimensionadas a 1400 px / JPEG 72%.
- Abertura: splash canvas → licença/trial (7 dias) → tela “Entrar” (sem senha) → `requestFullscreen()` no clique → app.
- PWA **presente neste pacote**: `<link rel="manifest" href="./manifest.json">`, `theme-color`, `apple-mobile-web-app-capable`, registro de `./sw.js` no `load`.
- Exportação Excel via **SheetJS 0.18.5** embutido no próprio HTML (linhas ~335–342).
- IA opcional: chave Gemini no localStorage (`SIGEM_GEMINI_KEY`), **fora do backup JSON**.
- Sincronização entre máquinas: **somente exportar/importar JSON** (substitui tudo).
- Licença por dispositivo: fingerprint `SIG-XXXX-XXXX` calculado **uma vez e congelado** em `FP_KEY` (UA 60 chars, tela, idioma, timezone, `hardwareConcurrency`, canvas). Chave `SIGEM-XXXX-XXXX-DDMMAA`: XOR nibble a nibble com salt `[7,11,3,13,5,17,2,19]` + validade DDMMAA. Há recuperação se a licença bater com o fingerprint recalculado (comentário no código: o FP antigo mudava com GPU/monitor).

Isso define o teto do artefato: **offline, single-device, single-admin**. Chaves `sigem_v2` (base) e `sigem_gd_v3` (atual) **não compartilham dados** — abrir um após o outro no mesmo navegador não migra nada.

---

## 4. Pacote de distribuição (o que veio além do HTML)

O `INSTRUCOES.txt` manda extrair **todos** os arquivos numa pasta fixa (`C:\SIGEM`) e não mudar de lugar depois de ativar a licença. O conjunto operacional é:

```
index.html          ← app
index_base.html     ← versão anterior (não é aberta pelo BAT)
manifest.json
sw.js
SIGEM.bat
INSTRUCOES.txt
LEIA-ME.md
```

### 4.1 `SIGEM.bat`

Duas linhas:

```
@echo off
start "" "%~dp0index.html"
```

Abre o `index.html` **da mesma pasta** no programa associado (navegador padrão). Não pede tela cheia, não registra PWA, não passa parâmetro. A tela cheia só acontece depois, no clique de **Entrar** (`entrarTelaCheia()`).

O `LEIA-ME.md` diz “abre no navegador em tela cheia”. **Isso não é o BAT** — é o `doLogin()` do `index.html`.

### 4.2 `manifest.json`

| Campo | Valor |
|---|---|
| `name` | SIGEM — Gestão de Entrega de Máquinas |
| `short_name` | SIGEM |
| `description` | Sistema Integrado de Gestão de Entrega de Máquinas — dev. AND CC |
| `start_url` | `./index.html` |
| `display` | `standalone` |
| `orientation` | `any` |
| `background_color` / `theme_color` | `#1a1a1a` |
| `lang` | `pt-BR` |
| `categories` | productivity, business |
| `shortcuts` | um atalho “Dashboard” → `./index.html` |
| `icons` | SVG data-URI 192 e 512, letra “S” branca em fundo `#1a1a1a`, `purpose: any maskable` |

O manifesto **ainda usa o nome antigo** (Entrega de Máquinas + AND CC). O `INSTRUCOES.txt` e o `LEIA-ME.md` já falam “Gestão de Manutenção”. Quem instala como PWA vê o nome da geração anterior.

### 4.3 `sw.js`

Estratégia **rede primeiro**; cache só como reserva offline.

- Nome do cache: `'sigem-' + (self.SIGEM_BUILD || Date.now())`.
- `self.SIGEM_BUILD` **não é definido no worker**. Cada `install` gera um cache com timestamp.
- `install`: `skipWaiting()`.
- `activate`: apaga **todos** os caches cujo nome começa com `sigem-`, depois `clients.claim()`.
- `fetch`: só GET; se a rede devolver 200 não-opaque, grava no cache; se a rede falhar, `caches.match`.
- `message === 'LIMPAR_CACHE'`: apaga **todos** os caches (não só `sigem-`).

O `index.html` no `load` registra `./sw.js`, chama `reg.update()` e, se já houver controller, manda `LIMPAR_CACHE`. Há também `forcarAtualizacao()` (clique no carimbo da sidebar): confirma, apaga caches, **unregister** de todos os SW, `location.reload(true)`.

**Limitação observada:** Chrome/Edge **não registram service worker em `file://`**. Como o BAT abre o HTML como arquivo local, PWA + SW só funcionam se alguém servir a pasta por HTTP(S). Em uso típico (duplo clique / BAT) o SW falha em silêncio (`catch` vazio).

### 4.4 `INSTRUCOES.txt` vs código

O que o texto manda e o que o código faz:

| Instrução | Código |
|---|---|
| Extrair todos os arquivos; pasta fixa; não mover depois da licença | Licença é fingerprint do **navegador/dispositivo**, não do caminho da pasta. Mover a pasta **não** troca o código `SIG-`. O aviso faz sentido para não perder `sw.js`/`manifest.json` relativos e para o usuário não “reinstalar” noutro perfil de browser. |
| Abrir `index.html` ou `SIGEM.bat` | Correto. |
| Primeira vez: copiar código do dispositivo e enviar a quem forneceu | Tela de licença + trial 7 dias (`FIRST_KEY`). |
| 100% offline, IA opcional precisa de internet | Correto. |
| Dados neste navegador; não limpar dados ao fechar | Correto — localStorage + IndexedDB + licença somem juntos. |
| Backup em Dados / Sync | Correto. |
| Primeiros passos: cadastrar **Fábricas, Áreas e Funções** | Fábricas e áreas têm CRUD. **Funções são as 6 constantes `FUNC`**, só leitura em Configurações. O INSTRUCOES pede um cadastro que **não existe**. |
| Situação Máq.: cadastre as máquinas | No app atual o cadastro “fonte única” está em **Configurações**, não na tela Situação Máq. |
| Use Plano de Ação, Corretivas, Preventivas, RPs, Backlog, relatórios | Correto para o `index.html` atual; a **base** não tem esses módulos. |

O `LEIA-ME.md` ainda descreve o menu antigo (Pendências, Máquinas, Configurações > Linhas de Produção) e trata GD como “NOVO”. O menu real do `index.html` já é o da §6.

---

## 5. Evolução `index_base.html` → `index.html`

A base é o produto **entrega de máquinas**. O atual é o mesmo casco (sidebar, login sem senha, `window.print`, JSON dump) inchado até CMMS de turno.

| | `index_base.html` | `index.html` atual |
|---|---|---|
| Tamanho | ~865 linhas | ~9347 + SheetJS |
| Título / marca | `SIGEM` + acrônimo expandido + AND CC | `Sistema`; marca visual esvaziada |
| Storage | `sigem_cfg` / `sigem_auth` / `sigem_v2` | `sigem_gd_*_v3` + IndexedDB `sigem_anexos_v1` |
| Seed | João/Carlos/Felipe; Marchesini/Huttlin/Uhlmann; 4 pendências (abril/2026) | `DEF` vazio (áreas/técnicos/máquinas `[]`); fábricas default `Fábrica 1`, `Fábrica 2` |
| Menu | Dashboard, Pendências, Técnicos, Máquinas, Por Técnico, Por Máquina, Atrasos | + Plano Semanal/Mensal, GD, Corretivas, RPs, Preventivas, Apadrinhamento, Links, Rel. Período, Config; “Por técnico/máquina” saem do menu |
| Pendência | 1 técnico, 1 máquina, descricao, impacta, bloqueio | + causa-raiz, 2 contramedidas, sub-ações, % , anexos, `idAcao`, origem rastreável, várias fábricas, TAG, linha, sem eficácia |
| Máquina | `linha` texto, sem fábrica, sem flags | `fabrica`, flags `gd` e `padrinho`, código interno |
| Técnico | nota 1–5 + pills + histórico | + 12 competências × 4 trimestres + Pareto + PDI |
| Senha | gravada (`sigem2024`) + UI alterar; **login não checa** | UI de senha removida; CSS + `AK` órfãos; só nome do admin |
| Licença / splash / PWA | não | sim |
| Anexos / Excel | não | IndexedDB + SheetJS |
| `planoAcao` leftover | não existe | página `PG.planoAcao` + `db.planoAcao` **fora de `PAGES`** |
| Áreas | array fixo `AREAS` (6 setores farma) | CRUD `db.areas` |
| Fábricas | não há (só setor/linha) | CRUD `db.fabricas` |

O que a base **já tinha** e o atual herdou: regra de liberação SIM/NÃO/Parcial, enums de prioridade/status/bloqueio, status de máquina de implantação, funções de técnico, turnos, avaliação comportamental, PDF da visão, sync JSON substitutivo, zona de risco “apagar tudo”.

**Inferência:** `index_base.html` ficou no pacote como referência/rollback, não como app de uso. O BAT aponta só para `index.html`.

---

## 6. Módulos (menu real do `index.html`)

O menu lateral (`PAGES`) é esta lista. Há páginas extras não listadas (ver §6.15).

### 6.1 Dashboard

Visão do dia: cards de pendências abertas / críticas / vencidas / que vencem hoje / bloqueadas / % concluídas; técnicos ativos; máquinas; ocorrências GD de hoje e “em análise”. Rankings (top 5 máquinas e técnicos com mais abertas). Faixa de alerta clicável para Atrasos. Atalhos para GD, Corretivas, Preventivas e até 4 links cadastrados.

Na **base**, o dashboard é só cards de pendências + rankings + tabela recente, sem GD/atalhos.

### 6.2 Plano de Ação (`pendencias`)

Núcleo do sistema atual. Tabela larga estilo planilha Excel, com filtro por coluna.

Campos visíveis: ID Ação (rastreio editável inline), Máquina, Problema, Causa raiz, Contramedida corretiva, Contramedida preventiva, Responsável(is), Prazo, Status, Origem, Área (na prática **fábricas** marcadas no formulário), TAG, Linha, Sem eficácia, Data de ocorrência, Observação, Prioridade, Progresso %, Anexos.

Ações: nova, editar, concluir OK, concluir “Não OK / sem eficácia”, PDF individual, relatório das selecionadas, importar Excel, indicador de evolução (Total / Abertas / Concluídas / Vencidas em canvas).

Cada pendência pode ter **sub-ações** (`acoes[]`); o % é `concluídas / total`. Sem sub-ações, o % é manual (slider).

Origens rastreadas: corretiva, ocorrência GD, RP (`origemTipo` / `origemId`). Badge 📝 se `origem === 'RP'`.

Na **base**, a tela chama-se só “Pendências”: filtros simples, um técnico, sem causa-raiz/sub-ações/Excel.

### 6.3 Plano Semanal/Mensal (`planoSM`)

Três abas (só no atual):

1. **Backlog Semanal** — ordens (`BL###`) com semana ISO, prazo default = próxima terça, técnico, nº OS, atividade, obs, concluída. Cadastro rápido (técnico + OS) e modal completo. Atraso em dias.
2. **Inspeções Mensais** — importação de planilha Excel genérica (headers + rows), filtros estilo Excel por coluna, PDF paisagem, histórico de planilhas (`INS` + timestamp).
3. **AGMT F2/F3** — dois contadores (Fábrica 2 / Fábrica 3) + obs + anexos. “Ordens aguardando chegada de material.”

Botão **Relatório do Dia** (título configurável, padrão `Gerencial 1º Turno`): seções opcionais PA vencidas, PA hoje, backlog pendente/concluído, RPs do dia, inspeções, AGMT.

### 6.4 Gerenciamento Diário (`gd`)

Ocorrências por fábrica e por linha (máquinas com flag `gd`).

Fluxo (código + LEIA-ME): escolher fábrica → chip da linha → + Nova ocorrência → data, turno, descrição → Ishikawa 6M (Método, Máquina, Mão de obra, Material, Medição, Meio ambiente) → causa-raiz e ação → opcional **Gerar pendência**.

Status de análise: Em análise / Ação definida / Resolvido.

Cards: hoje, 7 dias, em análise, ação definida, viraram pendência, total da seleção.

Quando uma linha está selecionada, lista os RPs vinculados àquela máquina.

**LEIA-ME (dados de planta, não hardcoded no JS padrão):**

- Fábrica 2: CAM5, CAM4, CAM3, MED1–MED6, MED8, UHL1, UHL2
- Fábrica 3: CAM1, CAM2, CAM6–CAM9, MED7, UHL3, UHL4

O código default de fábricas é `['Fábrica 1','Fábrica 2']`; as linhas CAM/MED/UHL entram pelo cadastro (Configurações). O LEIA-ME descreve a operação já configurada. O LEIA-ME ainda fala “Configurações > Linhas de Produção”; no código atual a linha **é** a máquina com `gd=true`.

### 6.5 Atrasos e Alertas (`atrasos`)

Filtros-card clicáveis: Vencidas, Vencem hoje, Vencem amanhã, Bloqueadas, Críticas, Impactam entrega, Todas abertas. Sem filtro: união de vencidas + hoje + bloqueadas (“atenção imediata”), ou “Tudo em dia!”.

Toast no login se houver vencidas ou que vencem hoje.

Na **base**, Atrasos lista só vencidas + bloqueadas, sem cards clicáveis nem “hoje/amanhã”.

### 6.6 Corretivas (`corretivas`)

Relatório de turno (`CR###`): data, turno, responsável/supervisor, N chamados.

Cada chamado: nº (reinicia por dia), descrição, hora abertura/fechamento e duração, técnicos (multi), máquina cadastrada ou “outra”, OBS, status (Liberado / Pendente / Em andamento), checkbox **Gerar pendência**, anexos.

PDF do relatório. Excluir o relatório **não** apaga pendências geradas.

Pode vincular um RP ao chamado (`chamadoRef = corretivaId::chamadoId`).

Ausente na base.

### 6.7 RPs (`rps`)

Relatório Padrão de Manutenção. Parser de texto (WhatsApp, com ou sem `*negrito*`) para campos DATA, LINHA, TAG, ORDEM, PROBLEMA, DESCRIÇÃO, FALHA REPETIDA, MATERIAL, MÁQUINA, MÉTODO, MÃO DE OBRA, CAUSA RAIZ, CONTRAMEDIDAS, STATUS, TÉCNICOS, IMPACTO EM CONDIÇÃO BÁSICA.

Status interno: Em análise / Corrigido / Em monitoramento.

Checagem de duplicidade (mesmo nº de Ordem, ou mesma Máquina + Problema + Data).

**Aplicar ao Plano de Ação** (uma vez): cria pendência com origem `RP`, prazo +7 dias, mapeamento de status.

Relatório por máquina: agrupa RPs, aponta problemas recorrentes, gera texto para e-mail/WhatsApp.

Ausente na base.

### 6.8 Preventivas (`preventivas`)

Lançamento por data+turno: máquina (texto, pode ser “outra”), técnicos, atividade, status (Pendente / Em andamento / Concluída), OBS. Agrupadas em cards por data+turno. Totais no topo.

Não gera pendência automaticamente.

Ausente na base.

### 6.9 Técnicos (`tecnicos` + página `por-tecnico`)

Cadastro: nome, função, turno, área, status (Ativo / Inativo / Férias / Afastado), matrícula, contato, obs, máquinas das quais é padrinho, “máquina PDI (em desenvolvimento)”. *(2026-09-28.3)* Mais grau / senioridade e fábrica.

Lista: nota em estrelas, pendências abertas, atalho de máquinas. *(2026-09-28.3)* Mais a coluna Grau e o botão de máquinas sob responsabilidade, com **Gerar resumo** (PDF das pendências abertas nessas máquinas).

Análise individual (4 abas no atual; 2 na base):

1. **Perfil e Pendências** — dados + KPIs (abertas, críticas, vencidas, concluídas, corretivas liberadas, preventivas).
2. **Comportamento** — nota 1–5, pontualidade/produtividade/colaboração, pills positivos/negativos/neutros, histórico de observações. Já existia na base.
3. **Avaliação de Desempenho** — 12 competências × 4 trimestres (notas 10/8/6/4/2), média geral, gráfico Pareto 80/20 em canvas, PDF “Avaliação Técnico”. Só no atual.
4. **Anexo PDI** — arquivos do Plano de Desenvolvimento Individual (até 8 MB). Só no atual. *(2026-09-28.3)* A aba traz também a **Matriz de Competências**: checklist de conhecimento mecânico por equipamento (nota 0 a 4, nível esperado, aderência em %, PDF), com catálogo fixo de 9 equipamentos e 222 habilidades.

Competências: Segurança, Trabalho em equipe, Proatividade, Conhecimento técnico, Resolução de problemas, Relatórios, Apontamento de horas, Encerramento de ordens, Log book, Apontamento OEE, Melhorias, Comunicação.

Funções fixas no código: Mecânico, Eletricista, Automação, Instrumentação, Técnico de Manutenção, Utilidades.

Turnos: 1º, 2º, 3º, Administrativo.

### 6.10 Situação das Máquinas (`maquinas` + `por-maquina`)

Lista: fábrica, linha, setor, fabricante, status operacional, nº de pendências abertas, **Liberação** (SIM / NÃO / Parcial).

Regra de liberação (código, **já na base**):

- 0 abertas → SIM
- alguma crítica **ou** `impacta === 'Sim'` → NÃO
- senão → Parcial

Ficha por máquina: dados + KPIs + alerta “liberada para entrega” ou não.

Cadastro “fonte única” em Configurações (não no módulo de situação). Campos: nome, fábrica, flag linha GD, setor, fabricante, código interno, status (`Em Implantação`, `Em Teste`, `Em Ajuste`, `Liberada`, `Parada`, `Finalizada`), obs, flag apadrinhada.

Na **base**, o cadastro é nesta própria tela (`mMaq`); campo `linha` é texto livre; não há fábrica/GD/padrinho. Há um leftover `closeModal` porque `mMaq` chama `closeModal()` no overlay (alias para `mClose()`).

### 6.11 Apadrinhamento (`padrinho`)

Consolida, por máquina marcada `padrinho`, tudo que houver de corretiva, preventiva, pendência e RP. Cards-filtro (todas, corretivas, liberadas, preventivas, pend. abertas, vencidas, RPs). Título configurável.

Há dois conceitos de “padrinho”: flag na **máquina** (aba Apadrinhamento) e lista `padrinhoMaquinas` no **técnico**. Não há cruzamento automático no código — **inferência:** o de máquina é o “equipamento crítico da planta”; o do técnico é “quem apadrinha o equipamento”.

Ausente na base.

### 6.12 Links / Acessos (`links`)

Central de URLs (título, descrição, url, ícone, categoria). Categorias com cor: Monitoramento, Comunicação, Indicadores, Documentos, Geral. Abre em nova aba. Atalhos no Dashboard (4 primeiros).

Ausente na base.

### 6.13 Relatório de Período (`relatorio`)

Filtro data inicial/final, turno, técnico; checkboxes incluir preventivas e pendências abertas. Preview + PDF. Totais de corretivas/chamados/liberados/pendentes + listas.

Ausente na base (lá o PDF é só `window.print` da página visível).

### 6.14 Configurações (`config`)

Fábricas (CRUD), Neural SIGEM (chave/modelo Gemini + 3 botões de IA), painel de armazenamento (MB localStorage vs IndexedDB, limpar fotos), tipos de atividade (CRUD; default Mecânica, Elétrica, Automação, Segurança, Documentação, Utilidades, Processo, Validação), cadastro de máquinas com flags GD/apadrinhada, áreas/setores, resumo de apadrinhadas, funções (lista **read-only** na `2026-09-07.1`; incluir, editar e apagar na `2026-09-28.3`), graus / senioridade *(2026-09-28.3; padrão Júnior, Pleno, Sênior, Especialista, com incluir, editar e apagar)*, zona de risco “Zerar Plano de Ação mantendo Stretch”.

**Dados / Sync** (`dados`, botão no rodapé, não no menu): exportar JSON, importar (substitui tudo), alterar nome do admin, estatísticas, “apagar tudo e restaurar padrão”.

Na **base** não há página Config: áreas/tipos/funções são constantes; Dados / Sync inclui alterar senha (não o nome do admin).

### 6.15 Páginas fora do menu (ainda no código atual)

- `por-tecnico`, `por-maquina` — abertas pelos botões Análise. Na base **estão no menu**.
- `dados` — sync.
- `planoAcao` — **segunda** implementação de “Plano de Ação” sobre `db.planoAcao` (OK / Não OK, abertas vs encerradas, prefixo `PA`). **Não está em `PAGES`.** Leftover; o plano vivo é `pendencias`.

---

## 7. Funcionalidades transversais

- **PDF** (janela + `window.print`): pendência, corretiva, período, técnico, inspeções, RPs por máquina, relatório do dia, indicador de evolução, “Gerar PDF” do menu (visão atual). Cabeçalho da base: “Sistema Integrado de Gestão de Entrega de Máquinas”.
- **Importação Excel** do Plano de Ação: mapeamento de colunas por aliases (descrição, máquina, técnico, prazo, prioridade, status, causa, contramedidas, origem, área, TAG, linha, sem eficácia, data ocorrência, obs). Cria máquina se o nome não existir. Detecta duplicidade por `idAcao` e “parecidas”.
- **Anexos** em corretiva, pendência, sub-ação, AGMT, PDI. Viewer de foto em overlay.
- **Busca universal** em selects/listas (técnicos, máquinas).
- **Tela cheia** (F11 / botão / clique em Entrar). O BAT **não** entra em tela cheia sozinho.
- **Neural SIGEM:** (1) Assistente de Priorização = **regras locais** (não é IA); (2) análise Gemini das ações abertas; (3) pergunta livre sobre os dados. Precisa de internet + chave.
- **Licença** por dispositivo + trial 7 dias; botão de status no canto; tela de bloqueio quando expira.
- **Migrações** no load: unificar linhas→máquinas, dedup de IDs, migrar apadrinhamento antigo, limpar áreas-exemplo, AGMT `qtd` → `f2`/`f3`.
- **Forçar atualização** no carimbo da versão (limpa Cache API + unregister SW). Não apaga localStorage.

---

## 8. Fluxos ponta a ponta

```
Instalação Windows (INSTRUCOES)
  → extrair pasta fixa → SIGEM.bat ou index.html
  → splash → código SIG-XXXX-XXXX (trial 7d ou colar licença)
  → Entrar (tela cheia) → posto único

Chamado no turno
  → Relatório de Corretivas (vários chamados)
      → [opcional] Gerar pendência → Plano de Ação
      → [opcional] Vincular / criar RP

Ocorrência na linha
  → Gerenc. Diário + Ishikawa 6M
      → [opcional] Gerar pendência → Plano de Ação / Atrasos

Texto WhatsApp do RP
  → Parser RP → cadastro
      → Aplicar ao Plano de Ação (prazo +7d)

Backlog da semana (OS + técnico, prazo terça)
Inspeção mensal (Excel colado)
AGMT (contagem F2/F3)
  → Relatório do Dia (gerencial 1º turno)

Pendência no prazo
  → Atrasos / toast no login
  → Concluir OK  ou  Concluir sem eficácia
  → Liberação da máquina (SIM/NÃO/Parcial)

Máquina crítica
  → Flag apadrinhada → aba Apadrinhamento (visão consolidada)

Outro computador
  → Dados/Sync exportar JSON → importar (substitui tudo)
  → nova licença (fingerprint diferente)
```

Fluxo da **base** (ainda visível no seed): abrir pendência na máquina em implantação → “Impacta entrega?” → Atrasos/bloqueio → concluir → badge Liberação SIM.

---

## 9. Papéis e permissões

Não há RBAC. Qualquer pessoa no dispositivo, após “Entrar”, vê e edita tudo (inclusive zona de risco e importação que substitui a base).

Papéis **de negócio** (dados, não contas):

- Administrador (nome na sidebar)
- Supervisor do relatório de corretiva (`responsavel`)
- Técnico(s) responsável(is) (`idTecs`)
- Padrinho de máquina (técnico e/ou flag na máquina)
- Emissor da licença (fora do app; gera chave a partir do fingerprint)

**Inferência:** um sistema próprio precisa de pelo menos: Admin, Supervisor de turno, Técnico (só os seus itens), Leitura gerencial.

---

## 10. Dados / entidades inferidos

Prefixos de ID gerados no cliente: `T` técnicos, `M` máquinas, `P` pendências, `CR` corretivas, `PV` preventivas, `OC` ocorrências, `RP` RPs, `BL` backlog, `LK` links, `INS` inspeções, `CH` chamados (interno ao relatório), `PA` leftover `planoAcao`.

### 10.1 Entidades e campos (do código de save / DEF atuais)

**Técnico:** id, nome, funcao, grau *(2026-09-28.3)*, turno, fabrica *(2026-09-28.3)*, area, status, matricula, contato, obs, padrinhoMaquinas[], pdiMaquinas[], matriz{} e matrizE{} (nota real e esperado por habilidade, *2026-09-28.3*), comp { nota, pont, prod, colab, attrs[], hist[{data,txt,tipo}], aval {t1..t4: {seg,eq,pro,ct,rp,rel,ah,eo,log,oee,mel,com}}, pdi[] anexos }.

**Máquina:** id, nome, fabrica, idLinha (legado), linha, setor, fabricante, codigo, status, obs, padrinho (bool), gd (bool).

**Pendência / ação do plano:** id, idMaq, idTec, idTecs[], area (fábricas concatenadas), tipo, prioridade, status, descricao, abertura, prazo, conclusao, impacta, bloqueio, obs, pct, acoes[], idAcao, causaRaiz, corretiva, preventiva, origem, tag, linha, dataOcorrencia, semEficacia, origemTipo, origemId, origemChamado, respTxt, maqTxt.

**Sub-ação:** desc, resp, prazo, concluida, dtConclusao, anexos, causaRaiz, preventiva, statusAcao, origem, areaAcao, tag, linha, semEficacia, dataOcorrencia, coment.

**Corretiva:** id, data, turno, responsavel, chamados[].

**Chamado:** id, num, descricao, idTec, idTecs[], obs, status, flagPend, idPendencia, idMaq, maqCustom, area, tipo, prioridade, hAbertura, hFechamento, pendDesc, pendPrazo, pendPrio, anexos[].

**Preventiva:** id, data, turno, maquina (nome texto), idTec, idTecs[], descricao, status, obs.

**Ocorrência GD:** id, idLinha, idMaq, data, turno, descricao, statusAnalise, ishikawa {6 listas}, causaRaiz, acaoDefinida, idPendencia.

**RP:** id, data, ordem, linha, tag, problema, descricaoProblema, falhaRepetida, falhaQtdVezes, falhaPeriodo, material, maquina4m, metodo, maoDeObra, causaRaiz, corretiva, preventiva, status, idTecs[], idTec, tecnicoTxt, impacto, idMaq, chamadoRef, criadoEm, idPendencia.

**Backlog:** id, semana, prazo, idTec, os, atividade, obs, dataCad, concluida.

**Inspeção:** id, mesLabel, headers[], rows[][], dataImport.

**AGMT:** { f2, f3, obs, atualizado } + anexos chave `agmt`.

**Link:** id, titulo, url, desc, ico, cat.

**Config global:** fabricas[], areas[], tipos[], tituloRelatorioDia, relatorioDoDiaSecoes, padrinho.titulo.

**Licença (não vai no backup de negócio):** `sigem_gd_licenca_v3`, `sigem_gd_fp_v3`, `sigem_gd_first_v3`.

### 10.2 Seed da base (`sigem_v2`) — evidência de domínio

Não está no `DEF` atual, mas documenta a planta para a qual o produto nasceu:

| ID | Nome | Função / papel | Área |
|---|---|---|---|
| T001 | João Silva | Mecânico, 1º turno, matrícula 4587 | Embalagem |
| T002 | Carlos Lima | Eletricista, 2º turno, start-up | Sólidos |
| T003 | Felipe Santos | Automação, 3º turno | Blister |

| ID | Máquina | Linha | Status | Obs |
|---|---|---|---|---|
| M001 | Marchesini | Linha 03 | Em Implantação | Máquina nova (Marchesini SpA, EQ-145) |
| M002 | Huttlin | Linha 02 | Em Teste | Ajustes finais (Huttlin GmbH, EQ-146) |
| M003 | Uhlmann | Linha 05 | Em Ajuste | Falta automação (EQ-147) |

Pendências de exemplo: sensor da esteira (impacta entrega), válvula pneumática crítica bloqueada à espera de peça, parametrização de IHM à espera de fornecedor, intertravamento de porta já concluído.

### 10.3 Listas de domínio (enums no JS atual)

| Lista | Valores |
|---|---|
| Prioridade | Crítica, Alta, Média, Baixa |
| Status pendência | Não iniciado, Em andamento, Aguardando peça, Aguardando fornecedor, Bloqueado, Em teste, Concluído |
| Bloqueio | Sem bloqueio, Aguardando peça/elétrica/automação/fornecedor/segurança/validação/produção |
| Status chamado | Liberado, Pendente, Em andamento |
| Status preventiva | Pendente, Em andamento, Concluída |
| Status análise GD | Em análise, Ação definida, Resolvido |
| Origem ação (datalist) | Corretiva, Preventiva, Auditoria, 5S, RCA, Melhoria, Outro |
| Status máquina | Em Implantação, Em Teste, Em Ajuste, Liberada, Parada, Finalizada |
| Status técnico | Ativo, Inativo, Férias, Afastado |

---

## 11. Regras de negócio extraídas

1. **Libera máquina** se não há pendência aberta; **não libera** se há crítica ou “impacta entrega”; senão **parcial**.
2. Pendência **vencida** = prazo &lt; hoje e status ≠ Concluído; **hoje** = prazo === data local ISO.
3. Progresso da pendência = fração de sub-ações concluídas; se status = Concluído, força 100%.
4. Concluir “Não OK” marca `semEficacia=true` e chama o mesmo `concluir()`.
5. Corretiva/ocorrência/RP geram pendência **uma vez** (`idPendencia` preenchido); exclusão da origem **não** cascateia.
6. RP → Plano de Ação: prazo = hoje+7; status RP `analise`→Em andamento, `corrigido`→Concluído, `monitoramento`→Em teste; origem=`RP`.
7. Numeração de chamado **reinicia por dia**.
8. Backlog: prazo operacional = **terça da janela**; cadastro rápido só exige técnico + OS (atividade pode ficar vazia no atalho; no modal é obrigatória).
9. Tipos/áreas apagados **não** reescrevem registros antigos.
10. Excluir fábrica zera `fabrica` das máquinas; excluir máquina deixa pendências/corretivas “sem máquina”.
11. “Zerar Plano de Ação” apaga pendências cujo texto **não** contém `"stretch"` (case-insensitive).
12. Trial 7 dias a partir de `FIRST_KEY`; depois exige licença válida para o fingerprint congelado. Licença tem data de validade no 4º bloco.
13. Priorização “IA” local soma pontos se já tem contramedida, prioridade baixa, em teste, sem bloqueio; penaliza `semEficacia`. O próprio UI avisa: *“Isto não é uma IA”*.
14. Duplicidade de RP: confirma e pode salvar mesmo assim.
15. Datas usam `toISOString().split('T')[0]` — **fuso UTC**, não local. Risco de “hoje” errado em GMT−3. **Limitação observada no código.** Já estava na base (`td()`).
16. Fingerprint é **congelado** na primeira execução; comentário no código admite que UA/tela/canvas mudavam a licença. Há fallback que revalida contra `_calcFP()` atual.

---

## 12. Limitações do artefato (pacote completo)

**Arquitetura**

- Sem servidor, sem multi-dispositivo em tempo real, sem histórico de auditoria, sem usuários.
- localStorage ~5 MB para o JSON; fotos no IndexedDB do **mesmo navegador**.
- Importar backup **substitui** a base inteira (sem merge). Backup da v3 **não** leva a chave Gemini nem a licença.
- `sigem_v2` e `sigem_gd_v3` são mundos separados; não há migrador no pacote.
- SheetJS inteiro (~centenas de KB minificados) dentro do HTML — manutenção difícil.
- Página `planoAcao` + `db.planoAcao` órfãs; constante `AK` de auth órfã; CSS de senha órfão.
- PWA declarado, mas **SW não sobe em `file://`** (uso via BAT). Cache name usa `Date.now()` porque `self.SIGEM_BUILD` nunca é injetado no worker.
- `SIGEM_BUILD` JS (`2026-08-02.1`) ≠ carimbo da UI (`2026-09-07.1`; `2026-09-28.3` na versão nova).

**Produto / UX**

- Login sem senha (qualquer um no tablet entra). A senha da base nunca foi ligada ao `doLogin()`.
- Licença reversível no cliente (salt e algoritmo visíveis no HTML).
- Sem concorrência: dois operadores no mesmo JSON se atropelam.
- Formulários grandes (Pendência ~900 px) pouco adequados a tablet no chão.
- Inconsistência de acento: o enum é `'Crítica'`, mas o card e o filtro “Críticas” do Plano de Ação, a fatia “Críticas” do Atrasos e as cores de prioridade comparam `'Critica'` **sem acento** — ficam sempre zerados ou sem cor. **Bug no artefato.** Na `2026-09-28.3` o card “Críticas” do dashboard filtra por `'Crítica'` e funciona; na base o dashboard também compara certo.
- Preventiva guarda `maquina` como string, não `idMaq` — matching de apadrinhamento é por nome normalizado.
- GD usa `idLinha` e `idMaq` após unificação; código ainda mistura os dois.
- Na `2026-09-07.1`, funções de técnico não eram editáveis (só as 6 constantes) — o INSTRUCOES pedia cadastro de Funções. Resolvido na `2026-09-28.3`.
- AGMT é um **contador**, não uma lista de OS.
- Inspeções são dump de Excel, sem modelo de “rota de inspeção”.
- PDI de máquina no técnico está rotulado “em desenvolvimento”.
- Chave Gemini no `prompt()` do navegador; modelo default `gemini-3.6-flash` (nome que o Google pode não reconhecer).
- Dois nomes de produto no mesmo zip (Entrega de Máquinas vs Gestão de Manutenção). LEIA-ME desatualizado em relação ao menu. Ele ainda manda gerenciar “Configurações > Linhas de Produção”, mas as linhas viraram máquinas marcadas como GD; `addLinha` / `delLinha` ficaram no código sem tela que as chame.

**Cobertura funcional que o SIGEM não tem (e o código não finge ter)**

- Ordens de serviço com ciclo de vida de CMMS (abertura → peça → execução → apontamento de horas → fechamento SAP).
- Estoque de peças, BOM, fornecedores além do texto “Aguardando peça/fornecedor”.
- Calendário de preventiva (PPM) com periodicidade — aqui preventiva é **lançamento do que foi feito no turno**, não um plano.
- Integração OEE / MES (há competência “Apontamento OEE”, sem módulo).
- Assinatura, GMP, trilha 21 CFR Part 11 — **inferência:** se a planta for farma, o artefato não atende compliance.
- App nativo / sync na nuvem / API.

---

## 13. O que isso sugere para um sistema próprio

Não copiar o monolito. Copiar o **modelo mental do turno**, que está maduro — e o **modelo mental de entrega de máquina**, que ainda está no DNA (liberação SIM/NÃO/Parcial, “impacta entrega”, status de implantação).

### 13.1 Núcleo a reimplementar (alto valor, comprovado no uso)

1. **Ativo** (máquina/linha) com fábrica, flags “é linha de GD” e “apadrinhada”, status de implantação/liberação.
2. **Evento de turno** = corretiva (N chamados, horários, fotos, técnicos).
3. **Plano de ação** como entidade de qualidade (causa-raiz, 2 contramedidas, ID de rastreio, eficácia OK/Não OK, origem rastreável) — não só “ticket”.
4. **GD / RCA rápido** com Ishikawa 6M na linha, promovendo a pendência.
5. **RP** com parser de texto operacional (o time já escreve nesse formato no WhatsApp).
6. **Painel de atraso** por urgência (vencida / hoje / amanhã / bloqueio / impacta entrega).
7. **Liberação de máquina** como KPI de entrega para produção (regra da base, ainda vigente).
8. **Backlog semanal com prazo terça + OS** (ritmo gerencial já existente).
9. **Relatório do Dia** montável por seções (substitui a reunião de 1º turno).
10. **Avaliação trimestral 12 competências + Pareto** (RH de manutenção), por cima da avaliação comportamental da base.

### 13.2 Como redesenhar (não reproduzir)

| No SIGEM atual | No sistema próprio |
|---|---|
| HTML + localStorage | API + Postgres, multi-usuário, sync |
| Pasta + BAT + `file://` | App hospedado; PWA de verdade (HTTPS) |
| Um admin, senha morta | Papéis: admin, supervisor, técnico, leitura |
| JSON dump | Backup incremental, não “substitui tudo” |
| Licença por fingerprint XOR no cliente | Conta da empresa / SSO |
| Gemini no browser | IA no backend, chave no servidor |
| Inspeção = Excel colado | Modelo de checklist por ativo, com import só como ponte |
| AGMT = dois números | Lista de OS aguardando material, por fábrica |
| Preventiva = diário do feito | Separar **plano PPM** de **execução do turno** |
| ID `P001` local | UUID + código de negócio (`idAcao`) |
| Duas chaves de storage (v2/v3) | Um schema versionado com migração |

### 13.3 Ordem de construção sugerida (técnica, não calendário)

1. Cadastros: fábrica, linha/máquina, técnico, tipos, áreas. Funções **cadastráveis** (o INSTRUCOES já espera isso).
2. Pendência/plano de ação + anexos + filtros + liberação de máquina.
3. Corretiva de turno → gera pendência.
4. GD + Ishikawa → gera pendência.
5. RP (formulário; parser WhatsApp como atalho).
6. Atrasos + Dashboard + Relatório do Dia + PDF.
7. Backlog / inspeções / AGMT.
8. Avaliação de técnico e apadrinhamento.
9. Import Excel do plano legado + import JSON `sigem_gd_v3` (e, se ainda existir operação na base, `sigem_v2`).
10. IA só depois da base estável (priorização por regras já existe e é honesta).

### 13.4 Dados a preservar na migração

O JSON `sigem_gd_v3` + IndexedDB de anexos **é** o legado de produção. Um importador que entenda `pendencias`, `corretivas.chamados`, `ocorrencias`, `rps`, `tecnicos.comp`, `backlog`, `inspecoes` evita retrabalho do chão.

Se ainda houver tablet na **base**, o JSON `sigem_v2` é outro formato (pendência rasa, 1 `idTec`, máquina sem fábrica). Não misturar.

Cuidado com: IDs duplicados (já houve bug e migração `_idsDedup`), nomes de máquina sem cadastro (`maqCustom` / `maqTxt`), acentos de prioridade, datas em UTC, leftover `planoAcao`.

---

## 14. Resumo dos módulos encontrados

**Menu atual:** Dashboard, Plano de Ação, Plano Semanal/Mensal (Backlog / Inspeções / AGMT), Gerenc. Diário, Atrasos, Corretivas, RPs, Preventivas, Técnicos, Situação Máq., Apadrinhamento, Links / Acessos, Rel. Período, Configurações (+ Dados/Sync no rodapé).

**Menu da base (histórico):** Dashboard, Pendências, Técnicos, Máquinas, Por Técnico, Por Máquina, Atrasos.

**Fora do menu atual:** análise por técnico, por máquina, leftover `planoAcao`.

**Soluções de apoio no zip:** PDF, import Excel, anexos IndexedDB, toast de vencimento, Neural SIGEM (regras + Gemini), licença/trial 7 dias, `SIGEM.bat`, `manifest.json` (nome antigo), `sw.js` (rede-primeiro; inútil em `file://`), splash canvas.

**Não copiar:** monolito HTML, fingerprint XOR, JSON que substitui tudo, senha que não autentica, PWA de arquivo local.

---

*Levantamento fiel aos sete arquivos do pacote (LEIA-ME, INSTRUCOES, index.html, index_base.html, manifest.json, sw.js, SIGEM.bat). Inferências estão rotuladas. Não substitui entrevista com o usuário final do turno.*
