import type { FeedbackTone, RecordPriority } from "@manutencao/shared";
import { DEMO_SUBASSEMBLIES } from "./demo-catalog";

// Registros da demonstração: pendências em todos os grupos do Meu Dia, feedbacks, problemas e rascunhos.
// Datas em dias relativos ao dia da carga: daysAgo no passado, dueInDays no futuro (negativo = atrasada).

export type DemoTask = {
  body: string;
  daysAgo: number;
  dueInDays: number | null;
  priority: RecordPriority;
  member: string | null;
  // Concluída há quantos dias; nulo = aberta.
  doneDaysAgo: number | null;
};
export type DemoFeedback = { body: string; daysAgo: number; member: string; tone: FeedbackTone };
export type DemoProblem = { body: string; daysAgo: number; member: string | null; line: string; machine: string; subassembly: string };
export type DemoEntry = { body: string; daysAgo: number };

/**
 * Pendências: atrasadas, de hoje, de amanhã, próximas, sem prazo e concluídas nas últimas semanas.
 * @example DEMO_TASKS.filter((task) => task.dueInDays !== null && task.dueInDays < 0 && task.doneDaysAgo === null).length // 3
 */
export const DEMO_TASKS: readonly DemoTask[] = [
  { body: "Comprar a Peça 1 para a Máquina 3", daysAgo: 6, dueInDays: -2, priority: "high", member: "c1", doneDaysAgo: null },
  { body: "Revisar o plano de preventiva da Linha 2", daysAgo: 9, dueInDays: -1, priority: "medium", member: null, doneDaysAgo: null },
  { body: "Pedir orçamento do Subconjunto 3 da Máquina 6", daysAgo: 12, dueInDays: -4, priority: "low", member: null, doneDaysAgo: null },
  { body: "Treinar o Colaborador 5 na Máquina 4", daysAgo: 3, dueInDays: 0, priority: "medium", member: "c5", doneDaysAgo: null },
  { body: "Conferir o estoque de peças da Linha 1", daysAgo: 2, dueInDays: 0, priority: "high", member: null, doneDaysAgo: null },
  { body: "Enviar o relatório semanal da manutenção", daysAgo: 1, dueInDays: 0, priority: "low", member: null, doneDaysAgo: null },
  { body: "Acompanhar o teste do Subconjunto 2 na Máquina 7", daysAgo: 1, dueInDays: 1, priority: "medium", member: "c9", doneDaysAgo: null },
  { body: "Atualizar a ficha técnica do Equipamento B", daysAgo: 4, dueInDays: 1, priority: "low", member: null, doneDaysAgo: null },
  { body: "Planejar a parada da Linha 4", daysAgo: 5, dueInDays: 5, priority: "high", member: "s2", doneDaysAgo: null },
  { body: "Calibrar o sensor do Subconjunto 2 da Máquina 1", daysAgo: 2, dueInDays: 8, priority: "medium", member: "c2", doneDaysAgo: null },
  { body: "Revisar a matriz de habilidades do 3º turno", daysAgo: 7, dueInDays: 12, priority: "low", member: "s3", doneDaysAgo: null },
  { body: "Organizar a bancada da oficina", daysAgo: 10, dueInDays: null, priority: "low", member: null, doneDaysAgo: null },
  { body: "Estudar melhoria no Subconjunto 3 do Equipamento C", daysAgo: 15, dueInDays: null, priority: "medium", member: null, doneDaysAgo: null },
  { body: "Trocar a correia do Subconjunto 2 da Máquina 2", daysAgo: 20, dueInDays: -15, priority: "high", member: "c3", doneDaysAgo: 16 },
  { body: "Fechar as ordens da semana", daysAgo: 12, dueInDays: -9, priority: "medium", member: null, doneDaysAgo: 9 },
  { body: "Revisar o painel elétrico da Máquina 5", daysAgo: 10, dueInDays: -5, priority: "high", member: "c6", doneDaysAgo: 6 },
  { body: "Montar o kit de peças da preventiva da Linha 3", daysAgo: 6, dueInDays: -2, priority: "medium", member: "c7", doneDaysAgo: 2 },
  { body: "Atualizar o quadro de turnos", daysAgo: 3, dueInDays: -1, priority: "low", member: null, doneDaysAgo: 1 },
];

/**
 * Feedbacks dos técnicos, positivos, de atenção e neutros, espalhados em 90 dias.
 * @example DEMO_FEEDBACKS[0].tone // "positive"
 */
export const DEMO_FEEDBACKS: readonly DemoFeedback[] = [
  { body: "Resolveu rápido a falha da Máquina 2 e explicou a causa para o turno", daysAgo: 3, member: "c1", tone: "positive" },
  { body: "Deixou o chamado da Máquina 6 sem o texto do que foi feito", daysAgo: 8, member: "c6", tone: "negative" },
  { body: "Ajudou o Colaborador 7 na troca de formato do Equipamento B", daysAgo: 12, member: "c8", tone: "positive" },
  { body: "Combinamos acompanhar a próxima preventiva da Linha 3", daysAgo: 18, member: "c7", tone: "neutral" },
  { body: "Ótima organização da bancada depois da parada", daysAgo: 25, member: "c4", tone: "positive" },
  { body: "Chegou atrasado na troca de turno duas vezes nesta semana", daysAgo: 31, member: "c10", tone: "negative" },
  { body: "Montou o passo a passo do Subconjunto 3 para o time", daysAgo: 40, member: "c5", tone: "positive" },
  { body: "Conversamos sobre o uso dos EPIs na Linha 4", daysAgo: 52, member: "c11", tone: "neutral" },
  { body: "Encontrou a causa raiz do Alarme 1 da Máquina 9", daysAgo: 60, member: "c9", tone: "positive" },
  { body: "Precisa registrar as horas no fim de cada atendimento", daysAgo: 75, member: "c2", tone: "negative" },
];

const [ALIMENTACAO, TRANSPORTE, SELAGEM, PAINEL] = DEMO_SUBASSEMBLIES;

/**
 * Problemas anotados direto pelo gestor (fora de chamado e RP), com linha, máquina e subconjunto.
 * @example DEMO_PROBLEMS[0].subassembly // "Subconjunto 2 · Transporte"
 */
export const DEMO_PROBLEMS: readonly DemoProblem[] = [
  { body: "Ruído e vibração no Subconjunto 2", daysAgo: 5, member: "c3", line: "l1", machine: "m1", subassembly: TRANSPORTE },
  { body: "Folga no eixo do Subconjunto 1", daysAgo: 11, member: null, line: "l2", machine: "m4", subassembly: ALIMENTACAO },
  { body: "Temperatura de selagem oscilando", daysAgo: 16, member: "c6", line: "l3", machine: "m6", subassembly: SELAGEM },
  { body: "Cabo solto no painel elétrico", daysAgo: 23, member: "c10", line: "l5", machine: "m10", subassembly: PAINEL },
  { body: "Desgaste da Peça 2 antes do previsto", daysAgo: 34, member: null, line: "l4", machine: "m8", subassembly: TRANSPORTE },
];

/**
 * Rascunhos da Entrada, só com o texto.
 * @example DEMO_ENTRIES.length // 3
 */
export const DEMO_ENTRIES: readonly DemoEntry[] = [
  { body: "Ver o ruído na Máquina 6", daysAgo: 0 },
  { body: "Ligar para o fornecedor da Peça 1", daysAgo: 0 },
  { body: "Ideia: checklist de partida da Linha 5", daysAgo: 1 },
];
