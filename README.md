# Gestão de Manutenção

Caderno do gestor: registrar, pendências, turno, equipe e dashboard.

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

### PC como servidor

Banco local restaurado do backup, API e um túnel público da Cloudflare (`docker-compose.servidor.yml`). No PowerShell, na raiz do repositório:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\servidor-pc.ps1
```

Com o banco local vazio, o script tira um dump novo da VPS (o `DATABASE_URL` do `.env`) em `backup-local\` e restaura. Se a VPS não responder, usa o dump mais recente que estiver lá. `-Restaurar` apaga o banco local e restaura de novo. No fim ele mostra o endereço `https://….trycloudflare.com` e o grava em `backup-local\tunnel-url.txt`. Esse endereço muda quando o túnel reinicia, e o `vercel.json` precisa apontar para ele.

Parar sem perder dados: `docker compose -f docker-compose.yml -f docker-compose.servidor.yml --profile local-db stop`.

### Desenvolvimento

Recarrega ao salvar: a API recompila com `tsc --watch` e reinicia, e o `web` roda o Vite. O `docker-compose.dev.yml` vai por cima do principal e monta `apps/api/src`, `apps/web/src` e `apps/web/index.html` no container. O `web` continua na frente da API.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

No Docker Desktop do Windows o bind mount não repassa eventos de arquivo, por isso os dois watchers rodam por polling. Mudou `schema.prisma`, dependências ou `packages/shared`? Suba de novo com `--build`.

## O que esta versão faz

1. Monorepo pnpm: `apps/api`, `apps/web`, `packages/shared`, Compose.
2. Uma conta gestor, cookie de sessão.
3. Login, tema claro/escuro em `data-theme` e menu lateral: o botão **Registrar** no topo, Dashboard, Pendências (com o selo das vencidas), Turno (Chamado, Ocorrência, RP, Pós-preventiva), Equipe (Colaboradores, Equipes) e, no rodapé, Configurações, o e-mail, o tema e Sair. No celular, a faixa de cima tem o menu e o atalho Registrar.
4. Fábricas, linhas (TAG, linha de GD e apadrinhada) com as máquinas (equipamentos) de cada linha, subconjuntos por modelo de equipamento (o equipamento da matriz; os subgrupos da matriz entram de partida), funções (as seis do SIGEM como seed, com criar e renomear), graus (Júnior, Pleno, Sênior e Especialista de padrão; grau em uso não pode ser excluído), colaboradores sem login, com cargo Técnico ou Supervisor (quem aparece em registro não pode ser excluído, só inativado). Cadastro em modal. Excluir fábrica com linha, ou linha com máquina, é recusado. Fábricas, linhas, máquinas, subconjuntos, funções, graus, competências e a matriz ficam em `/configuracoes`, em três abas (Fábricas, linhas e máquinas; Funções e graus; Avaliação); os endereços antigos `/cadastro/fabricas`, `/cadastro/maquinas` etc. redirecionam.
5. Registrar (`/captura`) Tarefa, Feedback e Problema (texto, tipo, quando, técnico se souber).
6. Ficha da Tarefa (prazo, prioridade, status, observação, fábrica, TAG, linha, anexo), do Feedback (alvo) e do Problema (máquina ou outra).
7. Pendências em `/acompanhamento` (o antigo `/registros` redireciona), com filtros de tipo, status e prazo (vencida, hoje, amanhã). Tarefa concluída não conta como vencida nem como vence hoje.
8. Chamado em `/turno/chamado` e ocorrência em `/turno/ocorrencia`, gravados como Problema.
9. Dashboard em `/dashboard`: abertas, vencidas, vencem hoje e concluídas (cada card abre a lista filtrada), linhas, colaboradores ativos, últimos registros e ranking de linhas e colaboradores com mais abertos.

10. Equipes em `/cadastro/equipes`: o coordenador cria equipes (por turno, por supervisor…), escolhe o supervisor de cada uma e coloca os técnicos. Um técnico fica em uma equipe só; o supervisor lidera, não é membro, e pode liderar mais de uma. Equipe com gente não pode ser excluída, nem supervisor que lidera equipe pode perder o cargo ou ser excluído. Colaboradores filtra por cargo e por equipe.

11. Ficha do colaborador em `/cadastro/colaboradores/:id` (clique no nome em Colaboradores ou no ranking do Dashboard), com abas. **Perfil**: dados, equipe (supervisor do técnico, ou técnicos das equipes que o supervisor lidera), contadores (em aberto, vencidas, concluídos, chamados, feedbacks) e os registros em que a pessoa aparece, como responsável, alvo ou técnico do chamado. Feedback não conta como aberto nem concluído. **Comportamento**: pontualidade, produtividade e colaboração, etiquetas de pontos positivos, de atenção e de situação (gravam ao escolher), e o histórico de observações, que são os feedbacks com a pessoa como alvo, agora com tom positivo, negativo ou neutro (também na ficha do feedback). **Desempenho** (só técnico): as competências cadastradas pelo coordenador em Configurações › Avaliação (as 12 do SIGEM de partida; criar, renomear, reordenar, arquivar, e excluir só sem nota) com nota 10 / 8 / 6 / 4 / 2 por trimestre e ano, média por trimestre, por competência e do ano (a média dos trimestres com nota, como no SIGEM), e um gráfico de barras ordenadas da média por competência. **Matriz** (só técnico): a matriz abaixo. **PDI**: linhas de que é padrinho e linhas em desenvolvimento (a mesma não fica nas duas), o que está em aberto nas apadrinhadas, e anexos do plano (até 10 MB). Quem tem anexo no PDI não pode ser excluído.

12. Matriz de competências na aba Matriz da ficha (`/competencias/:id` antigo redireciona): checklist de conhecimento mecânico por equipamento (os 9 equipamentos e as 222 habilidades do SIGEM de partida, cadastrados pelo coordenador em Configurações › Avaliação: criar, editar texto, subconjunto e nível, mover entre equipamentos, reordenar, arquivar e reativar; excluir só o que não foi avaliado nem marcado), nota de 0 a 4 ou “não se aplica”, esperado pelo nível da habilidade (ajustável por técnico) e aderência só nos equipamentos marcados para o técnico. Supervisor não tem matriz.

13. RP (Relatório Padrão de Manutenção) em Turno › RP (`/rp`). **Colar RP** (`/rp/novo`): cole o texto do WhatsApp (um ou vários relatórios, separados por `----` ou pelo título), o sistema lê os rótulos (DATA, LINHA, TAG, ORDEM, PROBLEMA, DESCRIÇÃO, FALHA REPETIDA, os 4M, CAUSA RAIZ, as duas CONTRAMEDIDAS, STATUS, TÉCNICO ou EXECUTANTES, IMPACTO) com ou sem asteriscos e em qualquer ordem, casa técnicos e linha com o cadastro e abre a ficha para você conferir. O que não casa fica como texto (técnicos fora do cadastro, linha e TAG sem cadastro). Status: em análise, em monitoramento, corrigido ou produzindo. RP parecido (mesma ordem, ou mesmo problema no mesmo dia e lugar) mostra um aviso, mas deixa salvar. Cada RP gera um Problema de origem RP nas Pendências, que acompanha a ficha (editar o RP atualiza o Problema; excluir o RP exclui o Problema). A lista filtra por período, fábrica, linha cadastrada, linha do texto, TAG, status, técnico, falha repetida e texto. A ficha do colaborador lista os RPs em que ele aparece. O leitor do texto é uma função pura (`apps/api/src/rp/domain/rp-text.ts`), testada com relatórios reais.

14. Pós-preventiva em Turno › Pós-preventiva (`/pos-preventiva`): o coordenador registra a ocorrência que apareceu depois de uma preventiva (data da preventiva e da ocorrência, linha, máquina, subconjunto do modelo da máquina, técnicos, o que foi feito, a ocorrência, a ação preventiva e o ponto de atenção), e pode ligar a ficha a um RP da linha. O ponto fica ativo até ser desligado; a ficha continua no histórico. A lista filtra por linha, máquina, subconjunto, técnico, período e só pontos ativos. A tela da máquina (`/maquinas/:id`, aberta pelas etiquetas das linhas em Configurações) mostra os pontos ativos por subconjunto, o histórico e os RPs da linha, e exporta a folha A4 para o técnico (`/maquinas/:id/folha`), com os subconjuntos escolhidos, caixa para marcar cada ponto e campo para assinar; a ficha também exporta sozinha. O RP mostra os pontos ativos da sua linha e as fichas ligadas a ele. Máquina com ficha não pode ser excluída nem trocar de modelo; subconjunto com ficha só arquiva.

## Fora desta versão

Relatório do dia, PDF, Ishikawa, relatório de turno, gerar pendência e PWA. Do RP ainda ficam de fora: preventiva virar Tarefa, RPs na avaliação do técnico, Dashboard, Pareto de causas e reincidência.

## Planejamento

Os documentos que guiaram esta versão ficam em `docs/`:

- [project-context.md](docs/project-context.md) — o norte: a dor do gestor e os três tipos de registro.
- [lista-mvp-sigem.md](docs/lista-mvp-sigem.md) — o corte do MVP, item a item do SIGEM.
- [plano-execucao-v1.md](docs/plano-execucao-v1.md) — arquitetura, fatias de construção e critério de pronto.
- [melhorias-ux-v1.md](docs/melhorias-ux-v1.md) — checklist de UX/UI sobre as telas da v1.
- [analise-sigem.md](docs/analise-sigem.md) e [sigem-nao-mapeado.md](docs/sigem-nao-mapeado.md) — levantamento do SIGEM usado como referência de domínio.
- [todoist-como-entrada.md](docs/todoist-como-entrada.md) — estudo do Todoist como canal de captura (fora do MVP).
