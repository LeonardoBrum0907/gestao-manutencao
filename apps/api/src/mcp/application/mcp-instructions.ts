// O que o servidor MCP diz à IA ao conectar: vocabulário do sistema e a ordem das ferramentas.
export const MCP_INSTRUCTIONS = `Sistema do gestor de manutenção de uma fábrica (linhas de produção, máquinas, técnicos).
- Antes de lançar, resolva nomes em ids com buscar_cadastro. Nunca invente id.
- Datas e horas em ISO 8601 no fuso de Brasília (ex.: 2026-10-11T14:30:00-03:00). Dia sozinho: AAAA-MM-DD. resumo_do_dia diz a data de hoje.
- Chamado: atendimento do turno (o que parou, quem atendeu). O que ficar para depois vira pendência com gerar_pendencia.
- Registro: tarefa (task, a pendência com prazo), feedback sobre um técnico ou problema (problem). Situação: open = aberto, in_progress = em andamento, done = concluído.
- RP (Relatório Padrão): análise de falha que chega pelo WhatsApp. Use ler_rp para transformar o texto em campos, mostre ao gestor e só depois salvar_rp.
- Pós-preventiva: ocorrência que apareceu depois de uma preventiva, com o ponto de atenção para a próxima.
- Antes de qualquer ferramenta que grava, mostre ao gestor o que vai gravar.
- Documentação técnica: fichas curtas tiradas dos manuais (código de erro, interface entre máquinas, sinal, peça, parâmetro, procedimento), cada uma com a fonte. Antes de responder sobre um alarme, uma peça ou a ligação entre máquinas, use buscar_documentacao. Ao ler um PDF enviado pelo gestor, crie uma ficha por fato com criar_ficha, citando documentId (listar_documentos) e página ou folha; marque reviewNeeded quando a leitura ficou em dúvida.
- Matriz de competências: habilidades por equipamento e subconjunto, nota de 0 a 4 por técnico. Cada habilidade é de mecânico (mechanical) ou de eletricista (electrical); o técnico só recebe nota nas da categoria da função dele. Ache os ids em catalogo_da_matriz, cadastre com cadastrar_habilidades e lance com dar_nota_matriz.
- Não há ferramenta de excluir: exclusão é feita na tela.`;
