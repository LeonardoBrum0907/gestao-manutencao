# Lista de decisão — MVP

Para o Leonardo Brum marcar o que entra no sistema próprio.

Duas partes, de propósito:

1. **Registros** — o produto novo (só o gestor). Marque primeiro.
2. **Inventário SIGEM** — o que o sistema antigo já tem hoje. Serve para ver, de relance, o que já existe que vira registro vs o que é extra.

Como usar: `[x]` entra no MVP. O resto fica de fora ou para depois.

`[x]` abaixo reflete o que o gestor pediu ao Leonardo: registros rápidos no celular para organizar no computador; **Pessoas**; **Pendências do dia a dia**; **Pendências Preventivas**. Prints do SIGEM dele = contexto da planta (operação zerada), não pedido de módulo.

Sugestões de corte e notas de print estão em *itálico* — palpite ou contexto, não decisão extra.

---

## Registros (produto novo)

Não é módulo do SIGEM. É o caderno do gestor: anotar rápido e acompanhar o que ficou aberto.

Cada tipo abaixo é um checkbox. O que **já existe no SIGEM** (com outro nome) está dito na linha. O que é **desenho nosso** também — para não misturar com o inventário.

### Tipos

- [x] **Tarefa** — algo a executar, com prazo e (quando der) responsável.
  **Pendências do dia a dia** (nome dele): anotações rápidas de pendências acontecendo no momento.
  *No SIGEM aparece como: backlog semanal, pendência gerada do chamado/ocorrência, item do plano de ação. Não copiar esse CMMS — a anotação rápida é o tipo Tarefa.*
- [x] **Feedback de funcionário** — observação sobre pessoa / comportamento / desempenho, para não esquecer.
  **Pessoas** (nome dele): anotações e observações de situações, para registrar para um feedback.
  *Desenho nosso. O SIGEM não tem esse tipo. Avaliação trimestral e PDI (inventário, Extra) são outra coisa.*
- [x] **Problema / documentação de falha** — falha, ocorrência ou pendência de equipamento/processo, para tratar depois.
  **Pendências Preventivas** (nome dele): anotações rápidas de ocorrências **pós-preventiva**. Não é o diário de preventiva executada no turno.
  *No SIGEM aparece como: chamado da corretiva, ocorrência do Gerenciamento Diário, RP (Relatório Padrão). O pedido é a ocorrência-anotação, não a ficha de corretiva.*
- [ ] **Outros registros** (tipo aberto) — apontamento que não cabe em tarefa, feedback ou problema.
  *Desenho nosso. No SIGEM os tipos são fechados (chamado, ocorrência, RP, backlog, ação). Ele não pediu tipo aberto.*

### Captura e acompanhamento

Ainda é registro — não é dashboard, GD nem relatório gerencial.

- [x] **Captura rápida** — texto no celular, ficha mínima (texto, tipo, quando, quem se souber). Detalhe depois.
  *Pedido dele: registros rápidos no celular. Desenho nosso como inbox de texto. No SIGEM o mais perto é “cadastro rápido de backlog” (só técnico + OS) e “colar texto do WhatsApp” no RP — atalhos do sistema antigo, sem [x] extra.*
- [x] **Acompanhamento** — uma lista do que está aberto: status, prazo, tipo.
  *Pedido dele: depois organizar no computador. Desenho nosso como lista única. No SIGEM isso está espalhado (plano de ação, painel de atrasos, backlog). Print de Atrasos/Dashboard = envelope gerencial, sem [x] extra.*

*Corte pelo texto dele: os três tipos com os nomes dele (Pessoas / Pendências do dia a dia / Pendências Preventivas) + captura no celular + organizar no PC. “Outros” ele não pediu.*

---

## Inventário SIGEM (o que já existe hoje)

Só o que **já existe** no SIGEM. Nada inventado. Uma linha = uma funcionalidade. Linguagem de chão de manutenção.

Marca em cada linha (ou no grupo):

- **→ Tarefa** / **→ Problema** — é o mesmo tipo de coisa que o bloco Registros
- **apoio** — cadastro (fábrica, máquina, técnico…) para pendurar o registro; não é o registro
- **extra** — GD, Ishikawa, PDI, AGMT, reunião, RH, legado, PWA… não é o caderno do gestor

Não há linha **→ Feedback**: o SIGEM não tem esse tipo.

Prints do SIGEM dele (planta real, operação zerada): Gerar PDF; Configurações (Fábrica 1–3, Flexografia, Manipulação, Oncológico; Neural SIGEM; storage 0 MB); Apadrinhamento vazio; Situação das Máquinas (CAM/MED, Em Implantação); Técnicos (Amilton); Atrasos; Gerenc. Diário; Dashboard. **Não** marcar Dashboard, Apadrinhamento, Situação Máq., Atrasos, Config, PDF ou Neural só porque aparecem na foto.

---

### Cadastros

Tudo **apoio** (ou extra de cadastro). Não é registro.

- [x] Fábricas — **apoio**
  *Fechado por órfão: GD é por fábrica e a máquina/ação já carregam fábrica. Sem este cadastro a linha GD e o campo “Fábrica, TAG, linha” ficam soltos. Print: F1–F3 + Flexografia, Manipulação, Oncológico.*
- [ ] Áreas / setores — **apoio**
- [x] Máquinas (nome, fábrica, setor, fabricante, código interno, status, observações) — **apoio**
  *Print: CAM/MED Em Implantação na Situação das Máquinas — contexto da planta, sem [x] no módulo de entrega.*
- [x] Marcar máquina como linha de Gerenciamento Diário — **extra**
- [x] Marcar máquina como apadrinhada (equipamento crítico) — **extra**
- [ ] Tipos de atividade (mecânica, elétrica, automação, segurança, etc.) — **apoio**
- [x] Funções do técnico (cadastro em Configurações, com incluir, editar e apagar; padrão: mecânico, eletricista, automação, instrumentação, manutenção, utilidades) — **apoio**
- [x] Técnicos (nome, função, turno, fábrica, área, status, matrícula, contato, observações) — **apoio** *(no produto novo o técnico é etiqueta: responsável da tarefa, alvo do feedback, nome no problema — sem login)*
  *Print: Amilton Nascimento, mecânico, 1º turno, Preventiva F2 e F3. Reforça Pessoas/Feedback como etiqueta; sem [x] extra (não é o módulo RH).*
- [x] Graus / senioridade do técnico (lista editável: Júnior, Pleno, Sênior, Especialista; campo Grau no técnico) — **apoio**
  *SIGEM 2026-09-28.3, em Configurações (ver* `docs/sigem-nao-mapeado.md`*). Entrou em 2026-10-03: tela Graus em Apoio e campo Grau no técnico; grau em uso não pode ser excluído.*
- [ ] Técnico padrinho de determinadas máquinas — **extra**
- [ ] Máquina de PDI no técnico (no SIGEM: “em desenvolvimento”) — **extra**
- [ ] Central de links e acessos (URLs por categoria, atalho no dashboard) — **extra**

*Prints mostram a planta (fábricas, CAM/MED, Amilton), mas cadastro em si não foi pedido. Se o registro precisar de “em qual máquina” e “qual pessoa”, são apoio — sem [x] extra agora. Linha de GD, padrinho, PDI e links — extra.*

---

### Operação de turno

#### Mapeia para registros

- [x] Chamado (nº do dia, descrição, horários, duração, técnicos, máquina ou “outra”, status, observação) — **→ Problema**
  *Fechado por órfão: você marcou relatório de corretivas e “vincular RP ao chamado”. Sem o chamado esses dois não têm o que reportar nem o que vincular.*
- [ ] Gerar pendência a partir do chamado — **→ Tarefa**
- [ ] Fotos / anexos no chamado — **→ Problema** *(anexo do registro)*
- [x] Gerenciamento Diário: ocorrências por fábrica e por linha — **→ Problema** *(a ocorrência; a tela GD por fábrica/linha é o envelope extra)*
  *Pedido: anotação rápida de ocorrência pós-preventiva. Print: GD com as seis fábricas, zerado — envelope da ocorrência, sem [x] extra na reunião GD.*
- [ ] Gerar pendência a partir da ocorrência — **→ Tarefa**
- [ ] Backlog semanal (OS, técnico, atividade, prazo na terça) — **→ Tarefa**
- [ ] Cadastro rápido de backlog (só técnico + OS) — **→ Tarefa** *(atalho do backlog, não a captura de texto no celular)*
- [ ] Resumo do backlog por técnico (tabela na aba Backlog Semanal) — **extra**

#### Extra

- [x] Relatório de corretivas do turno (data, turno, supervisor, vários chamados) — **extra** *(envelope gerencial; o chamado em si está no grupo acima)*
- [x] Vincular um RP ao chamado — **extra**
- [x] Preventivas feitas no turno (o que foi executado; não é calendário periódico) — **extra**
  *Pedido dele é anotação **pós-preventiva** (ocorrência), não este diário do que foi executado no turno. Ver ocorrência do GD acima.*
- [ ] Ishikawa 6M na ocorrência — **extra**
- [x] Causa-raiz, ação e status da ocorrência (em análise / ação definida / resolvido) — **extra** na ficha 6M; o **status** e a **ação** ecoam acompanhamento / Tarefa
- [x] Ver RPs da linha no Gerenciamento Diário — **extra**
- [ ] Inspeções mensais (importar planilha Excel + PDF) — **extra**
- [ ] AGMT: contagem de ordens aguardando material (Fábrica 2 e Fábrica 3) — **extra**
- [ ] Observação e anexos do AGMT — **extra**

*À luz do texto dele: a ocorrência (pós-preventiva) mapeia para Problema; a pendência do momento mapeia para Tarefa no bloco Registros — não o chamado/backlog/plano completos. Fora: relatório de turno, diário de preventiva executada, Ishikawa, ver RPs no GD, inspeções Excel, AGMT.*

---

### Qualidade / plano de ação

#### Mapeia para registros

- [x] Plano de ação (pendências em tabela tipo planilha, filtro por coluna) — **→ Tarefa**
- [x] Responsáveis, prazo, prioridade, status, observação — **→ Tarefa** *(campos de acompanhamento)*
- [x] Fotos / anexos na ação e na sub-ação — **→ Tarefa** *(anexo; sub-ação em si é extra)*
- [x] Painel de atrasos (vencidas, hoje, amanhã, bloqueadas, críticas, impactam entrega) — **→ Tarefa** *(pedaço de acompanhamento; “impactam entrega” é legado)*
- [ ] Aviso ao entrar se há ações vencidas ou que vencem hoje — **→ Tarefa** *(aviso da lista aberta)*
- [x] RP: colar texto do WhatsApp e gravar — **→ Problema** *(captura no SIGEM; não é o inbox de texto do celular)*
- [x] Ficha do RP (ordem, problema, falha repetida, 4M, causa-raiz, técnicos, impacto) — **→ Problema** no núcleo (problema); **extra** na ficha 4M / falha repetida / impacto

#### Extra

- [x] ID de rastreio da ação — **extra**
- [x] Causa-raiz + contramedida corretiva + contramedida preventiva — **extra**
- [x] Fábrica, TAG, linha e data da ocorrência na ação — **apoio** *(contexto da Tarefa/Problema)*
- [ ] Sub-ações e percentual de progresso — **extra**
- [ ] Concluir OK ou Não OK (sem eficácia) — **extra**
- [x] Origem rastreável (veio de corretiva, GD ou RP) — **extra**
- [ ] Importar plano de ação do Excel — **extra**
- [x] Aviso de RP duplicado — **extra**
- [x] Aplicar RP no plano de ação — **extra**
- [x] Relatório de RPs por máquina (problemas que repetem) — **extra**
- [x] Apadrinhamento: tudo da máquina crítica numa tela (corretivas, preventivas, pendências, RPs) — **extra**

*Pendência simples entra com a Tarefa no bloco Registros (Pendências do dia a dia), não com este plano de ação. Print de Atrasos zerado e Apadrinhamento vazio — contexto, sem [x]. RP / causa-raiz / sub-ações / Excel / recorrência — extra.*

---

### Relatórios

A lista de acompanhamento continua sendo o lugar de organizar. A dashboard desta versão segue a **base** do SIGEM (`index_base.html`, a versão antiga: cards, ranking, recentes), não o painel cheio de GD e atalhos do SIGEM atual.

**Nesta versão**

- [x] Dashboard: abertas, vencidas, vencem hoje, concluídas — cada card abre a lista filtrada
- [x] Dashboard: contagem de máquinas e de técnicos ativos
- [x] Dashboard: últimos registros *(no SIGEM só existe na versão antiga, como “Pendências recentes”; o dashboard atual não tem)*
- [x] Dashboard: ranking curto de máquina e de técnico com mais abertos

**Fora desta versão**

- [ ] Dashboard cheio (ocorrências GD de hoje, análises GD abertas, críticas, avanço geral em %, alerta “Atenção necessária hoje”, atalhos de corretiva/preventiva, links) — **extra**
- [ ] Relatório do Dia (gerencial do 1º turno, seções ligáveis) — **extra**
- [ ] Relatório de período (intervalo de datas, turno, técnico) — **extra**
- [ ] PDF da ação / das ações selecionadas — **extra**
- [ ] Indicador de evolução do plano (total, abertas, concluídas, vencidas) — **extra**
- [ ] PDF do relatório de corretivas — **extra**
- [ ] Gerar PDF da tela que está aberta — **extra**

*A base do SIGEM (`index_base.html`) era cards de pendência + ranking + tabela recente. O dashboard atual tirou a tabela recente e somou os cards de GD, críticas e avanço. GD, relatório e PDF ficam de fora: o JSON não trouxe esse movimento.*

---

### Pessoas

Tudo **extra** (RH de manutenção). **Não é o Feedback** do bloco Registros.

- [x] Análise individual do técnico (pendências, corretivas, preventivas) — **extra**
- [x] Avaliação comportamental (nota, pontualidade, produtividade, colaboração, histórico) — **extra**
- [x] Avaliação trimestral (12 competências + Pareto 80/20) — **extra**
- [x] PDF “Avaliação Técnico” — **extra**
- [x] Anexos do Plano de Desenvolvimento Individual (PDI) — **extra**
- [x] Matriz de Competências (checklist de conhecimento mecânico por equipamento: nota 0 a 4, nível esperado, aderência em %, PDF; 9 equipamentos e 222 habilidades de partida, catálogo editável pelo coordenador) — **extra**
  *SIGEM 2026-09-28.3, na análise do técnico, aba Anexo PDI (ver* `docs/sigem-nao-mapeado.md`*). Não é a avaliação trimestral de 12 competências. Entrou em 2026-10-03, a pedido do gestor, em `/competencias`, com três diferenças do SIGEM: o gestor marca os equipamentos que se aplicam ao técnico e a aderência conta só esses; “não se aplica” é separado da nota 0; sem PDF por enquanto.*

*Fora. O Feedback do gestor é anotação rápida (**Pessoas**), não nota nem PDI. Cadastro do técnico (etiqueta) está em Cadastros; print do Amilton reforça isso, sem [x] extra aqui.*

---

### Entrega de máquina (legado)

Nasceu como controle para **liberar máquina nova/em implantação** para produção. Continua no SIGEM atual. Tudo **extra**.

- [ ] Status da máquina: Em Implantação / Em Teste / Em Ajuste / Liberada / Parada / Finalizada — **extra** *(status operacional simples da máquina, se precisar, já está no cadastro)*
- [ ] “Impacta entrega?” na pendência — **extra**
- [ ] Motivo de bloqueio (peça, elétrica, automação, fornecedor, segurança, validação, produção) — **extra**
- [ ] Liberação automática SIM / NÃO / Parcial — **extra**
- [ ] Tela Situação das Máquinas (lista + badge de liberação) — **extra**
- [ ] Ficha da máquina (indicadores + alerta de liberação para produção) — **extra**

*Print: Situação das Máquinas com CAM/MED Em Implantação, operação zerada — contexto da planta, não pedido deste módulo. Bloco fora.*

---

### Extras / PWA / licença / IA

Tudo **extra** em relação ao caderno do gestor. PWA/offline só importam se a captura no celular depender disso no app próprio (aí é desenho nosso, não cópia desta lista).

- [ ] Instalar como aplicativo no tablet (PWA) — **extra**
- [ ] Uso offline — **extra**
- [ ] Atalho Windows para abrir o sistema — **extra**
- [ ] Tela cheia ao entrar — **extra**
- [ ] Tela de abertura (splash) — **extra**
- [ ] Licença por computador + teste de 7 dias — **extra**
- [ ] Login sem senha, só com o nome do administrador (trocado em Dados / Sync) — **extra** *(no produto novo é a conta única do gestor, com senha)*
- [ ] Priorização automática por regras (o próprio SIGEM avisa: não é IA) — **extra**
- [ ] Análise das ações abertas com IA (Gemini) — **extra**
- [ ] Pergunta livre à IA sobre os dados — **extra**
- [ ] Backup: exportar e importar arquivo (importar substitui tudo) — **extra** *(sobreviência do posto SIGEM; no produto novo é outro desenho)*
- [ ] Fotos e PDFs no aparelho (espaço, limpar anexos) — **extra** *(anexo no registro, se entrar, está em chamado/ação acima)*
- [ ] Zerar o plano de ação mantendo itens “Stretch” — **extra**
- [ ] Apagar tudo e restaurar o padrão — **extra**
- [ ] Forçar atualização do aplicativo — **extra**

*Nada daqui entra. Captura no celular é o item do bloco Registros, não este PWA. Print: Neural SIGEM, storage 0 MB, Gerar PDF, licença 365 dias — contexto, sem [x].*

---

## Órfãos e o que foi fechado

Versão mantida (marcas do Leonardo). Só entrei `[x]` em peça que a seleção deixava sem pai.

| Marcou | Faltava | O que fiz |
|---|---|---|
| Relatório de corretivas · Vincular RP ao chamado | **Chamado** | Marquei o chamado. Sem ele o relatório e o vínculo não têm objeto. |
| GD por fábrica · campo Fábrica/TAG/linha · máquina.fábrica | **Fábricas** | Marquei o cadastro. Área e tipo de atividade continuam de fora (texto na ficha basta). |
| Aplicar RP no plano · ID de rastreio · causa-raiz + 2 contramedidas · fotos na ação · indicador de evolução | **Plano de ação** (tabela) | **Não** marquei o módulo. Essas peças penduram na **Tarefa** já marcada — senão voltamos o SIGEM inteiro. |

**Não é órfão (pai já está marcado):** apadrinhamento (flag + tela) · ver RPs no GD (RP + GD + linha) · aviso de RP duplicado · relatório de RPs por máquina · funções + técnicos · causa-raiz/status da ocorrência + GD · PDI (anexo sem “máquina PDI”).

**Nesta versão, a dashboard** usa abertas, vencidas, hoje, concluídas, máquinas, técnicos, últimos registros e ranking curto. Relatório do Dia, período, GD e PDF continuam de fora. Painel de atrasos: vencida/hoje usam o prazo da Tarefa; bloqueadas e “impacta entrega” ficam sem o módulo de entrega.

**Continua de fora:** Ishikawa · AGMT · inspeções · entrega de máquina · PWA / licença / IA · aviso ao entrar · sub-ações · concluir OK/Não OK · Excel.

---

*Inventário:* `docs/analise-sigem.md` *— só o que o SIGEM tem. Bloco Registros: desenho nosso (norte em* `docs/project-context.md`*).*