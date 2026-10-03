# SIGEM novo — o que a lista ainda não tem

Pacote lido: `SIGEM_5609.zip`. Fonte: `index.html` (carimbo da tela **2026-09-28.3**). A análise anterior descreve a tela **2026-09-07.1**. O menu lateral é o mesmo. `index_base.html` segue o casco antigo de entrega de máquinas, sem estas telas.

Itens novos de verdade: **2**. Desde 2026-10-02 os dois estão na [lista MVP](lista-mvp-sigem.md). Graus entrou na v1 em 2026-10-03; a matriz segue de fora por enquanto.

---

## Novo

### Matriz de Competências — registro

- **Nome na tela:** Matriz de Competências (aba **Anexo PDI**, em Técnicos → Análise). O título do checklist é *Check List de Conhecimento Específico Mecânico por Equipamento*.
- **O que faz:** lança, por técnico, a nota real (0 a 4) e o nível esperado de cada habilidade mecânica, mostra o que atende ou fica abaixo, a aderência em %, e gera PDF (botão **Gerar PDF**; o PDF da avaliação do técnico também inclui a matriz quando já há nota).
- **Tipo:** registro.

O catálogo vem fixo no código: 9 equipamentos (blistadeira, encartuchadeira e encaixotadora CAM, Uhlmann e Mediseal) e 222 habilidades. Não há tela para cadastrar habilidade nova. Escala na legenda: 0 Não Apto / Não Aplicável, 1 Em Treinamento, 2 Treinado, 3 Apto, 4 Referência no Tema. O esperado padrão sai do nível da habilidade (Básico = 2, Intermediário = 3, Avançado = 4) e pode ser ajustado naquele técnico.

A avaliação trimestral de 12 competências e o anexo de arquivo do PDI já estão na lista. Esta matriz é outra coisa: checklist de conhecimento por equipamento.

### Graus / Senioridade — cadastro

- **Nome na tela:** Graus / Senioridade (Configurações). No técnico o campo chama **Grau / Senioridade**; na lista de técnicos a coluna é **Grau**.
- **O que faz:** mantém a lista de senioridade do técnico (padrão Júnior, Pleno, Sênior, Especialista), com incluir, editar e apagar, e grava o grau escolhido no cadastro.
- **Tipo:** cadastro.

---

## Já estava na lista

Mesma função, com outro nome na tela ou com um acréscimo em cima do que a lista já descreve.

| Na tela desta versão | Onde já está na lista |
|---|---|
| Funções disponíveis, agora com incluir / editar / apagar (antes eram 6 nomes fixos) | Funções do técnico |
| Coluna e campo **Fábrica** no técnico | Técnicos + Fábricas |
| Botão de máquinas do técnico (*Máquinas sob responsabilidade*) e **Gerar resumo** (PDF das pendências abertas nessas máquinas) | Técnico padrinho de determinadas máquinas |
| **Devolutiva** na sub-ação (“como foi a entrega?”) | Sub-ações (o campo já era o comentário da sub-ação) |
| Filtro de coluna com várias marcas, no estilo Excel | Plano de ação, filtro por coluna |
| Importar planilha: espelhar, atualizar pelo ID Ação, agrupar linhas do mesmo ID, resumo do que mudou | Importar plano de ação do Excel |
| Assistente de Priorização (*Oportunidades de fácil conclusão*), agora também com RPs prontos, backlog no prazo e texto para e-mail/WhatsApp | Priorização automática por regras |
| **Semana do Backlog** no Relatório do Dia | Relatório do Dia |
| `SIGEM.bat` abre sempre no Microsoft Edge | Atalho Windows para abrir o sistema |

---

## Visto e deixado de fora

Mudança de carimbo, de atalho ou de texto, e código que não abre tela.

- O carimbo da sidebar e do splash passou a **2026-09-28.3**. A constante `SIGEM_BUILD` no JavaScript continua `2026-08-02.1`.
- `LEIA-ME.md`, `INSTRUCOES.txt`, `manifest.json` e `sw.js` descrevem os mesmos módulos de antes.
- A função que montaria um plano de ação por técnico (`renderPlanoAcaoTab`) existe no arquivo e nenhuma aba a chama. As abas do técnico continuam: Perfil e Pendências, Comportamento, Avaliação de Desempenho, Anexo PDI.
- A página interna `planoAcao` (segunda tabela, fora do menu) continua fora do menu, como na análise anterior.
