# Melhorias de UX/UI — v1

Para o Leonardo Brum marcar o que entra. Código lido em `/home/ubuntu/gestao-manutencao` (tokens, `Button` / `Card` / `Modal` / inputs, `AppShell`, sidebar, login, dashboard, cadastros, acompanhamento, captura, ficha, chamado e ocorrência). Nenhum código foi alterado.

O visual de partida **já é o SIGEM**: sidebar clara, canvas sálvia, cards com sombra leve, raio 16 / controle 10, IBM Plex Sans, verde `#1d6b45`. Isto não é troca de identidade. É resposta ao mouse, hierarquia e leitura nas telas que existem.

Como usar: `[x]` = fazer. O que está em **Já está bom** fica como está.

Telas que existem hoje: Login, shell (sidebar + faixa “Menu” no celular), Dashboard, Captura, Acompanhamento, Registros, Ficha (`/registros/:id` — tarefa, feedback, problema da captura, chamado, ocorrência), Chamado, Ocorrência, Fábricas, Máquinas, Funções, Técnicos. Modal só nos quatro cadastros.

---

## Já está bom — não mexer

- **Tokens claro/escuro.** `--bg`, `--surface`, `--sidebar-*`, `--accent`, `--danger`, raio e sombra estão completos nos dois temas. A sidebar clara (`#f4f7f5`) separa do canvas (`#e7ece8`) com borda, no espírito SIGEM.
- **IBM Plex Sans** (400–700) no `index.html` e em `--font-sans`. Não trocar por Inter ou outra sans genérica.
- **`PageTitle`.** Eyebrow, título, texto e ação à direita repetem o mesmo desenho em todas as telas.
- **Foco visível global** (`outline` 2px no accent). Não tirar.
- **Modal acessível no básico:** portal, `role="dialog"`, `aria-modal`, título ligado, Escape, clique no fundo, no celular sobe de baixo (`items-end`).
- **Captura curta** em coluna `max-w-2xl`: três tipos, texto, quando, quem. A ficha vem depois. Esse fluxo fica.
- **Acompanhamento** já tem filtros (tipo, status, prazo), a linha abre a ficha no clique e no Enter/Espaço, e é o **único** hover de verdade do app (`hover:bg-accent-soft`).
- **Grupos da sidebar** (Dashboard, Caderno, Turno, Apoio) e o item ativo em `--sidebar-active`.
- **Estados vazios** em português (“Nenhuma fábrica ainda.”, “Nenhum registro com esses filtros.”).
- **Tema** claro/escuro com `aria-pressed`, na sidebar e no login.
- **Contagens do dashboard** ligadas à lista certa (`/acompanhamento?status=open`, `due=overdue`, `due=today`, `status=done`) e ao cadastro de máquinas e técnicos.

---

## Hover e foco

- [ ] **Botões mudos.**
  **Onde:** primitivo `Button` — login, captura, fichas, chamado, ocorrência, “Nova…” / “Gravar” / “Excluir” / “Sair”.
  **Hoje:** primary, ghost e danger só mudam com `disabled:opacity-50`. Sem hover, sem active, sem transição.
  **Mudar:** primary escurece o verde no hover; ghost ganha fundo `--chip` ou `--accent-soft`; danger (confirmar exclusão) escurece o fundo suave. Transição curta, igual em todos.

- [ ] **Sidebar sem hover no item inativo.**
  **Onde:** sidebar, todos os links.
  **Hoje:** só o item da rota atual pinta `--sidebar-active`. Os outros ficam texto muted, parados.
  **Mudar:** hover com um verde mais fraco que o ativo, para não confundir “estou aqui” com “posso clicar”. O ativo continua como está.

- [ ] **Cards e escolhas clicáveis sem hover.**
  **Onde:** tipos na Captura; cards de contagem e “Últimos registros” no Dashboard; cada card em Registros; nome que abre o modal em Fábricas, Máquinas, Funções e Técnicos; botões “Máquina cadastrada / Outra” na ficha de problema e no chamado; chips de prazo no Acompanhamento (o não pressionado).
  **Hoje:** o selecionado/pressionado troca borda e `--accent-soft`. O resto não reage. Em Registros o card inteiro é link e parece um card estático de cadastro.
  **Mudar:** hover de borda ou fundo leve no que é clicável; nos tipos da captura e no par máquina/outra, o não selecionado clareia antes do clique. Manter o hover da linha do acompanhamento.

- [ ] **Alternância de tema sem hover.**
  **Onde:** login e rodapé da sidebar.
  **Hoje:** o lado escolhido fica verde; o outro é texto muted, sem hover.
  **Mudar:** hover no lado inativo (fundo `--chip`). O pressionado fica como está.

- [ ] **Foco do modal não entra no primeiro campo.**
  **Onde:** modais de Fábricas, Máquinas, Funções, Técnicos.
  **Hoje:** Escape e rótulo funcionam. Abrir não foca o nome. Tab atravessa para a página atrás (o resto da UI não fica `inert`).
  **Mudar:** focar o primeiro campo ao abrir, prender o Tab dentro do diálogo e devolver o foco ao botão que abriu.

- [ ] **Link de anexo sem hover.**
  **Onde:** bloco Anexo na ficha da tarefa.
  **Hoje:** nome do arquivo em verde, sem sublinhado e sem hover. “Remover” é ghost mudo.
  **Mudar:** sublinhar no hover (e no foco). O botão entra no hover geral do `Button`.

---

## Tipografia

- [ ] **Números do dashboard sem alinhamento tabular.**
  **Onde:** os seis cards de contagem e os “N abertos” dos rankings.
  **Hoje:** `text-4xl font-semibold` no IBM Plex, mas sem `tabular-nums`. Dois dígitos dançam quando a lista atualiza.
  **Mudar:** `font-variant-numeric: tabular-nums` nesses números. O tamanho 4xl fica.

- [ ] **Texto longo estoura a linha.**
  **Onde:** coluna Registro no Acompanhamento; corpo do card em Registros.
  **Hoje:** o dashboard corta com `line-clamp-2`. A tabela e a lista de registros mostram o texto inteiro — uma captura longa vira uma faixa alta.
  **Mudar:** duas linhas no card de Registros; na tabela, duas linhas com o texto completo no `aria-label` (já existe) ou no `title`.

- [ ] **“Gravado” parece texto de ajuda.**
  **Onde:** ficha da tarefa, do feedback, do problema, chamado e ocorrência (quando a ficha já existe).
  **Hoje:** “Ficha gravada.” / “Chamado gravado.” / “Ocorrência gravada.” em `text-sm text-muted`, a mesma cor da dica.
  **Mudar:** uma linha curta em verde (`--accent` ou `--accent-soft` com texto `--text`), perto do botão, some ou fica discreta. Não é toast novo.

- [ ] **Eyebrow um pouco cartaz.**
  **Onde:** todo `PageTitle`, mais “Gestor” / “SIGEM” no login e na sidebar.
  **Hoje:** `text-xs font-semibold uppercase tracking-[0.16em]` (0.18em no login). A hierarquia está certa.
  **Mudar:** se o tracking parecer pôster, baixar para ~0.08em. Não tirar o eyebrow — ele separa Caderno, Turno e Apoio.

Não mexer no corpo `text-sm` dos formulários nem no título `text-2xl`. A escala já está consistente.

---

## Cor

A paleta sálvia + um verde fica. O furo é outro: status, prazo e prioridade usam o mesmo chip.

- [ ] **Status com a mesma cor em todo lugar.**
  **Onde:** chip em Acompanhamento, Registros e “Últimos registros”; status de máquina e de técnico nas listas (texto muted na segunda linha).
  **Hoje:** Aberto, Em andamento e Concluído são `bg-chip` igual. Parada, Inativo, Férias e Afastado também não se separam de Liberada / Ativo.
  **Mudar:** três tons em cima dos tokens que já existem — aberto neutro (`--chip`), em andamento verde suave (`--accent-soft`), concluído mais apagado. Máquina parada e técnico inativo/afastado puxam `--danger` no texto ou num chip pequeno. O nome do status continua escrito (não só a cor).

- [ ] **Prazo e prioridade sem alerta.**
  **Onde:** coluna Prazo e filtros Vencida / Hoje / Amanhã no Acompanhamento; campo Prioridade na ficha da tarefa (hoje é só `<select>`).
  **Hoje:** “Vencida” é um botão igual a “Amanhã”. Na tabela, data vencida é `text-muted`, igual a um prazo folgado. Prioridade alta não aparece na lista.
  **Mudar:** chip ou texto da data vencida em `--danger`; “hoje” num âmbar novo **só se** entrar um token `--warning` (não existe hoje — decidir se vale o token ou se “hoje” fica `--accent-soft`). Prioridade alta pode ser um chip na linha da tarefa; média e baixa ficam texto. Não colorir a tela inteira.

- [ ] **Excluir parece botão desligado.**
  **Onde:** “Confirmar exclusão” / “Confirmar” em Fábricas, Máquinas e Técnicos.
  **Hoje:** tom `danger` é fundo `--danger-soft` e texto `--danger`, sem hover. O primário verde chama mais atenção do que apagar.
  **Mudar:** o passo de confirmar fica sólido (fundo danger, texto claro). O primeiro clique “Excluir” continua ghost.

- [ ] **Ghost some no card.**
  **Onde:** Cancelar, Excluir, Remover, Anexar, Sair — em todo card e no modal.
  **Hoje:** ghost é `bg-surface` com borda. No tema claro, `--surface` e `--card-bg` são o mesmo `#fbfcfa`. O botão é uma borda fina no meio do card.
  **Mudar:** fundo `--chip` no repouso ou só no hover (combinar com o item de hover). A borda fica.

Não introduzir segunda cor de marca. O verde `#1d6b45` / `#3dbe7a` no escuro permanece o único acento.

---

## Espaçamento

- [ ] **Cadastro simples gasta um card por nome.**
  **Onde:** Fábricas e Funções. Máquinas e Técnicos têm segunda linha, mas o mesmo `Card` com `p-4 sm:p-5` e `gap-3`.
  **Hoje:** cada fábrica ou função é um bloco alto para uma palavra. A lista cresce rápido e a rolagem fica longa.
  **Mudar:** Fábricas e Funções em linhas compactas (padding vertical tipo a tabela do acompanhamento, ~`py-3`). Máquinas e Técnicos podem continuar em linha com duas linhas de texto, com menos padding que o card de formulário. O card de formulário (`p-4 sm:p-5`) fica nos forms.

- [ ] **Ficha da tarefa é uma coluna só.**
  **Onde:** ficha da tarefa; modal de máquina; modal de técnico. Chamado já agrupa abertura/fechamento em duas colunas no `sm`.
  **Hoje:** tarefa empilha texto, quando, responsável, prazo, prioridade, status, observação, fábrica, TAG, linha, com o mesmo `gap-4`. Máquina e técnico fazem o mesmo dentro do modal (`gap-3`), até o `max-h` de 40rem.
  **Mudar:** dois blocos visuais na tarefa — “O que é” (texto, quando, status, prioridade, prazo, responsável) e “Onde” (fábrica, TAG, linha, observação). No modal de máquina/técnico, o mesmo: identificação em cima, marcas e observação embaixo, com um título `text-sm` entre eles. Não criar tela nova.

- [ ] **Colunas estreitas certas, não alargar.**
  **Onde:** Captura, Ficha, Chamado, Ocorrência (`max-w-2xl`); o resto em `max-w-5xl`.
  **Hoje:** o shell centraliza isso. Formulário longo não vira linha infinita no desktop.
  **Mudar:** nada na largura. Se sobrar respiro, usar no agrupamento do item anterior.

---

## Listas

- [ ] **Nome de cadastro não parece clicável.**
  **Onde:** Fábricas, Máquinas, Funções, Técnicos.
  **Hoje:** o nome é `<button>` sem estilo de link. O card em volta não é o clique (o Excluir está ao lado). Em Registros o card inteiro navega e o desenho é quase o mesmo.
  **Mudar:** nome em peso medium com hover (cor accent ou sublinhado). Onde o card inteiro não é o clique, o botão Excluir continua separado. Em Registros, o hover do card (item de hover) deixa claro que a linha abre a ficha.

- [ ] **Excluir não tem volta.**
  **Onde:** Fábricas, Máquinas, Técnicos.
  **Hoje:** “Excluir” troca no lugar por “Confirmar” / “Confirmar exclusão”. Não há “Cancelar”. Só confirmar ou recarregar a página. Funções não exclui (as seis do SIGEM) — isso fica.
  **Mudar:** ao pedir exclusão, mostrar Confirmar e Cancelar. Cancelar restaura o ghost. Pode ser na própria linha; não precisa de modal se os dois botões couberem.

- [ ] **Cadastro e Registros não dizem que estão carregando.**
  **Onde:** Fábricas, Máquinas, Funções, Técnicos, Registros.
  **Hoje:** Dashboard e Acompanhamento mostram “Carregando…”. Nessas listas, `data` vazio não desenha nada até chegar — a tela fica só com o título. O vazio de verdade (“Nenhuma fábrica ainda.”) está certo e fica.
  **Mudar:** a mesma frase curta `text-sm text-muted` enquanto `isPending`. Sem skeleton.

- [ ] **Tabela do acompanhamento no celular.**
  **Onde:** Acompanhamento.
  **Hoje:** tabela `min-w-[640px]` dentro de `overflow-x-auto`. No telefone o prazo sai da tela e a pessoa rola para o lado. O hover da linha está bom no desktop.
  **Mudar:** abaixo de `sm`, cada registro vira um bloco (tipo, status, prazo, duas linhas de texto) com a mesma navegação da linha. De `sm` para cima, a tabela permanece.

- [ ] **Rankings só se leem.**
  **Onde:** Dashboard, “Máquinas com mais abertos” e “Técnicos com mais abertos”.
  **Hoje:** lista nome + “N abertos”. Não há filtro por máquina ou técnico no acompanhamento, então um clique não tem para onde ir sem feature nova.
  **Mudar:** deixar como leitura. Se um dia existir filtro, aí o nome vira link. Não inventar a rota agora.

---

## Modal

- [ ] **Fechar e Cancelar fazem a mesma coisa.**
  **Onde:** os quatro modais de cadastro.
  **Hoje:** no topo, botão ghost “Fechar”; no fim do form, “Cancelar”. Os dois chamam `close`. Numa máquina ou técnico, “Fechar” come uma linha antes dos campos.
  **Mudar:** um controle só no topo (texto “Fechar” ou um × com `aria-label="Fechar"`) e “Cancelar” no rodapé **ou** o contrário — não os dois com o mesmo peso. Escape e clique no fundo continuam.

- [ ] **Fundo do menu mobile não é o do modal.**
  **Onde:** sidebar aberta no celular (`lg:hidden`).
  **Hoje:** o modal escurece com `bg-app/40`. O menu cobre a página com `bg-canvas` opaco — uma parede sálvia, a tela some. O painel em si (272px, grupos, tema, Sair) está certo.
  **Mudar:** o mesmo véu `bg-app/40` do modal, clique fecha, `aria-label` “Fechar menu” fica.

- [ ] **Arquivo e data destoam do `TextInput`.**
  **Onde:** “Quando” e “Prazo” na captura e nas fichas; “Nº do dia”, horários e duração no chamado; input de arquivo na ficha da tarefa.
  **Hoje:** data e número repetem a classe do controle na mão (no chamado usam `controlClass`). O arquivo é `<input type="file" class="text-sm">`, visual do navegador no meio do card.
  **Mudar:** data e número passam pelo mesmo primitive dos outros campos (para herdar hover/foco quando existir). O arquivo ganha a mesma borda `rounded-control` / `border-line`, sem virar outro componente de upload.

O sheet no celular (`items-end` até `sm`, centralizado depois) e o `max-h` com scroll ficam.

---

## Dashboard

- [ ] **Seis cards iguais, inclusive vencida e concluída.**
  **Onde:** Dashboard — Abertas, Vencidas, Vencem hoje, Concluídas, Máquinas, Técnicos ativos.
  **Hoje:** o mesmo `cardLink` (borda, sombra, número 4xl). Vencidas não pesa mais que concluídas. Nenhum tem hover, embora todos sejam link.
  **Mudar:** Abertas neutro; Vencidas com borda ou número em `--danger`; Vencem hoje em destaque suave; Concluídas mais quietas (número muted). Máquinas e Técnicos continuam neutros — são cadastro, não prazo. Hover do item de cards clicáveis entra aqui.

- [ ] **“Últimos registros” já está no caminho certo.**
  **Onde:** Dashboard.
  **Hoje:** tipo em eyebrow, chip de status, corpo em duas linhas, data, link para a ficha. Vazio é um card.
  **Mudar:** só o hover e o chip de status (itens acima). Não virar tabela — a tabela é a do acompanhamento.

---

## Mobile

O app é o mesmo no telefone (sem rota separada). A captura é o uso principal fora da mesa.

- [ ] **Captura atrás do “Menu”.**
  **Onde:** faixa superior do `AppShell`, só abaixo de `lg`.
  **Hoje:** “Menu” à esquerda e a palavra “Gestão” à direita. Para anotar de novo é abrir a sidebar e achar Captura. A ficha, depois de gravar, também só volta pelo menu ou pelo histórico do navegador.
  **Mudar:** na faixa, um atalho “Captura” (texto, o mesmo verde do botão) além de “Menu”. Na ficha, um link texto “Acompanhamento” sob o título — a lista que organiza no computador. Não criar barra inferior nova.

- [ ] **Faixa não diz a tela.**
  **Onde:** header mobile.
  **Hoje:** o miolo é sempre “Gestão”. O nome da tela está no `h1`, mais abaixo.
  **Mudar:** opcional e pequeno — trocar “Gestão” pelo título da rota (Dashboard, Captura, Acompanhamento, etc.). Se o atalho Captura ocupar a direita, o título pode ficar no `h1` e este item cai.

- [ ] **Confirmar exclusão ao lado do nome quebra a linha.**
  **Onde:** Fábricas, Máquinas, Técnicos, no estreito.
  **Hoje:** `flex` com o nome e o botão na mesma linha. “Confirmar exclusão” é mais largo que “Excluir” e empurra o nome.
  **Mudar:** no estreito, ações embaixo do nome, alinhadas à direita. No `sm+`, continuam na mesma linha.

- [ ] **Alvo de toque da sidebar e dos filtros já é aceitável.**
  **Onde:** itens da sidebar (`py-2.5`), botões (`py-2.5`), prazo (`py-2`).
  **Hoje:** perto de 40px. Checkbox de chamado e de “Linha de GD” / “Apadrinhada” está dentro do `<label>`, então o texto também marca.
  **Mudar:** nada, salvo se o hover/foco aumentar padding sem querer. Não encolher.

---

## Ordem sugerida, se for fazer em uma leva

Não é decisão fechada. Os que mais se veem no uso diário:

1. Hover do `Button`, da sidebar e dos cards/tipos clicáveis.
2. Cor de status, vencida e card de contagem no dashboard.
3. Excluir com Cancelar; ghost que se enxerga.
4. Acompanhamento em blocos no celular; texto longo contido.
5. Atalho Captura na faixa mobile.
6. Ficha da tarefa em dois blocos; modal com um só fechar e foco no primeiro campo.
