# Norte da solução

Para o Leonardo Brum. O SIGEM recebido é **referência de domínio**, não o produto a copiar.

## Dor

O gestor de manutenção tem agenda corrida e precisa **registrar muita coisa** sem parar o dia: tarefas a fazer, feedbacks de funcionários, documentação de problemas e outros apontamentos. Depois precisa **acompanhar** o que ficou aberto.

O sistema ganha se a captura for rápida no celular e a lista do que está em aberto for confiável. Perde se exigir ficha completa (Ishikawa, 12 competências, AGMT, etc.) na hora do registro.

## O que entra no desenho

Três tipos de registro, no mínimo:

| Tipo | O que o gestor está fazendo |
|---|---|
| Tarefa | Algo a executar, com prazo e (quando der) responsável |
| Feedback | Observação sobre pessoa / comportamento / desempenho, para não esquecer |
| Problema | Falha, ocorrência ou pendência de equipamento/processo, para tratar depois |

Cada registro nasce **mínimo** (texto, tipo, quando, quem se souber) e pode ganhar detalhe depois. Acompanhar = lista por status, prazo e tipo — não um segundo caderno.

## O que isso implica

- Captura no celular (texto primeiro; voz depois, no app próprio).
- Uma fonte da verdade: o nosso sistema, não Todoist + planilha + SIGEM.
- Todoist/Ramble ensinam o hábito (Inbox descartável); não são o CMMS.
- Do SIGEM, herdar só o que fecha essa dor (pendência simples, chamado/ocorrência como *problema*, backlog como *tarefa*). Deixar de fora o que é reunião gerencial ou RH pesado, até alguém pedir.

## Quem usa

**Só o gestor.** Técnico não tem login nem app. Aparece como dado: responsável da tarefa, alvo do feedback, nome no problema.

Isso simplifica o MVP: uma conta, captura no celular dele, sem conflito de dois operadores no mesmo registro. “Atribuir a um técnico” é etiqueta, não convite para o sistema.

## Pedido do gestor

O gestor falou com o Leonardo: no celular, registros rápidos para depois organizar no computador. Os nomes dele — **Pessoas** (anotações e observações de situações, para um feedback), **Pendências do dia a dia** (anotações rápidas do que está acontecendo no momento) e **Pendências Preventivas** (anotações rápidas de ocorrências pós-preventiva, não o diário de preventiva executada). Prints do SIGEM (F1–F3 + Flexografia/Manipulação/Oncológico, CAM/MED em implantação, técnico Amilton, operação zerada) são contexto da planta, não pedido de Dashboard, Apadrinhamento, Atrasos, Config, PDF ou Neural. Corte na [lista MVP](lista-mvp-sigem.md).

## Arquitetura / stack (v1)

Repo novo, monólito com `apps/api` e `apps/web` separados, TypeScript nos dois lados, Docker Compose (`api`, `web`; Postgres de `DATABASE_URL` ou `db` local no profile) em qualquer ambiente. API em **NestJS** (módulo = bounded context: Cadastro, Registro, Turno, Dashboard; Fastify é a alternativa mais magra), Prisma no Postgres. Front em React + TanStack Query + Tailwind, pastas por domínio (não por tipo de arquivo), visual SIGEM via tokens CSS e tema selecionável (`data-theme`, light/dark e extensão). Só o gestor autentica; captura no celular é o mesmo app responsivo. Plano executável: [plano-execucao-v1.md](plano-execucao-v1.md).
