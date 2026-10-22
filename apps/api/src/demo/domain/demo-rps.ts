import type { RpBulkAction, RpCauseDto, RpFourM, RpStatus } from "@manutencao/shared";
import { DEMO_SUBASSEMBLIES } from "./demo-catalog";

// RPs (Relatório Padrão) da demonstração. "paste" entra como se o gestor tivesse colado o texto do
// WhatsApp; "public" entra pela página pública da equipe e pode ter a decisão do Supervisor 1.

export type DemoRp = {
  daysAgo: number;
  machine: string;
  subassembly: string;
  orderNumber: string;
  problem: string;
  description: string;
  repeatedTimes: string | null;
  causes: Partial<Record<RpFourM, string>>;
  rootCause: string;
  corrective: string;
  preventive: string;
  status: RpStatus;
  members: string[];
  channel: "paste" | "public";
  review: RpBulkAction | null;
};

const [ALIMENTACAO, TRANSPORTE, SELAGEM, PAINEL] = DEMO_SUBASSEMBLIES;

/**
 * Dez RPs dos últimos dois meses, em todos os status e com as três decisões da página pública.
 * @example DEMO_RPS.filter((rp) => rp.channel === "public").length // 4
 */
export const DEMO_RPS: readonly DemoRp[] = [
  {
    daysAgo: 2, machine: "m1", subassembly: TRANSPORTE, orderNumber: "0010", problem: "Alarme 2 de posição na esteira",
    description: "A máquina parava a cada poucos minutos com o Alarme 2.", repeatedTimes: "3",
    causes: { machine: "Guia da esteira desalinhada." }, rootCause: "Parafuso da guia solto pela vibração.",
    corrective: "Guia realinhada e parafuso travado.", preventive: "Incluir o aperto da guia na preventiva mensal.",
    status: "monitoring", members: ["c1", "c2"], channel: "public", review: null,
  },
  {
    daysAgo: 5, machine: "m4", subassembly: SELAGEM, orderNumber: "0009", problem: "Selagem fraca nas embalagens",
    description: "Embalagens abrindo no teste de qualidade.", repeatedTimes: null,
    causes: { material: "Lote novo de filme mais grosso.", method: "Temperatura não ajustada para o lote." },
    rootCause: "Receita do produto sem a temperatura do filme novo.", corrective: "Temperatura ajustada e receita atualizada.",
    preventive: "Conferir a receita sempre que mudar o lote de filme.", status: "corrected", members: ["c5"], channel: "public", review: "approve",
  },
  {
    daysAgo: 8, machine: "m7", subassembly: PAINEL, orderNumber: "0008", problem: "Disjuntor do painel desarmando",
    description: "O painel desarmou duas vezes no turno.", repeatedTimes: "2",
    causes: { machine: "Motor do Subconjunto 2 com consumo alto." }, rootCause: "Rolamento do motor travando.",
    corrective: "Rolamento trocado.", preventive: "Medir a corrente do motor na preventiva.",
    status: "producing", members: ["c10"], channel: "public", review: "request_review",
  },
  {
    daysAgo: 11, machine: "m9", subassembly: ALIMENTACAO, orderNumber: "0007", problem: "Falta de produto na alimentação",
    description: "O Subconjunto 1 deixava passar berços vazios.", repeatedTimes: null,
    causes: { labor: "Ajuste feito fora do padrão." }, rootCause: "Passo a passo do ajuste não estava na máquina.",
    corrective: "Ajuste refeito com o padrão.", preventive: "Deixar o passo a passo plastificado na máquina.",
    status: "corrected", members: ["c11", "c12"], channel: "public", review: "reject",
  },
  {
    daysAgo: 15, machine: "m2", subassembly: TRANSPORTE, orderNumber: "0006", problem: "Correia do transporte rompida",
    description: "A correia rompeu no meio da produção.", repeatedTimes: "2",
    causes: { material: "Correia fora da especificação." }, rootCause: "Compra de correia de outro fornecedor.",
    corrective: "Correia trocada pela especificada.", preventive: "Travar o código da correia no cadastro de compras.",
    status: "producing", members: ["c3"], channel: "paste", review: null,
  },
  {
    daysAgo: 21, machine: "m6", subassembly: SELAGEM, orderNumber: "0005", problem: "Resistência de selagem queimada",
    description: "Sem aquecimento no Subconjunto 3.", repeatedTimes: null,
    causes: { machine: "Resistência no fim da vida útil." }, rootCause: "Troca da resistência fora do plano.",
    corrective: "Resistência trocada.", preventive: "Trocar a resistência a cada 6 meses.",
    status: "corrected", members: ["c6", "c7"], channel: "paste", review: null,
  },
  {
    daysAgo: 28, machine: "m10", subassembly: PAINEL, orderNumber: "0004", problem: "Sensor sem leitura no painel",
    description: "O painel não lia o sensor do Subconjunto 2.", repeatedTimes: null,
    causes: { machine: "Cabo do sensor rompido." }, rootCause: "Cabo passando por canto vivo.",
    corrective: "Cabo trocado e protegido.", preventive: "Revisar a passagem dos cabos na preventiva.",
    status: "producing", members: ["c9"], channel: "paste", review: null,
  },
  {
    daysAgo: 36, machine: "m3", subassembly: ALIMENTACAO, orderNumber: "0003", problem: "Vazamento de ar no cilindro",
    description: "Cilindro perdendo pressão e falhando a alimentação.", repeatedTimes: "4",
    causes: { machine: "Vedação do cilindro gasta.", method: "Preventiva sem troca de vedação." },
    rootCause: "Plano de preventiva sem a troca da vedação.", corrective: "Vedação trocada.",
    preventive: "Incluir a troca da vedação no plano trimestral.", status: "monitoring", members: ["c1"], channel: "paste", review: null,
  },
  {
    daysAgo: 45, machine: "m5", subassembly: TRANSPORTE, orderNumber: "0002", problem: "Ruído alto no transporte",
    description: "Ruído metálico no Subconjunto 2.", repeatedTimes: null,
    causes: { machine: "Engrenagem com dente quebrado." }, rootCause: "Falta de lubrificação.",
    corrective: "Engrenagem trocada e lubrificada.", preventive: "Lubrificar a cada 15 dias.",
    status: "corrected", members: ["c4", "c8"], channel: "paste", review: null,
  },
  {
    daysAgo: 55, machine: "m8", subassembly: SELAGEM, orderNumber: "0001", problem: "Alarme 1 de temperatura",
    description: "A temperatura passava do limite e a máquina parava.", repeatedTimes: null,
    causes: { machine: "Termopar descalibrado." }, rootCause: "Termopar sem calibração anual.",
    corrective: "Termopar calibrado.", preventive: "Calibrar o termopar uma vez por ano.",
    status: "analysis", members: ["c8"], channel: "paste", review: null,
  },
];

/**
 * Os 4M no formato do RP: marcado quando o relatório traz o texto da causa.
 * @example demoRpCauses({ machine: "Guia solta." }).machine // { marked: true, text: "Guia solta." }
 */
export function demoRpCauses(causes: Partial<Record<RpFourM, string>>): Record<RpFourM, RpCauseDto> {
  const cause = (key: RpFourM): RpCauseDto => ({ marked: Boolean(causes[key]), text: causes[key] ?? null });
  return { material: cause("material"), machine: cause("machine"), method: cause("method"), labor: cause("labor") };
}
