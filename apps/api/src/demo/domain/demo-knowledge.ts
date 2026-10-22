import type { TechCardType } from "@manutencao/shared";
import { DEMO_SUBASSEMBLIES } from "./demo-catalog";

// Pós-preventivas e fichas de documentação técnica da demonstração.

export type DemoPostPreventive = {
  machine: string;
  subassembly: string;
  preventiveDaysAgo: number;
  occurrenceDaysAgo: number;
  members: string[];
  done: string;
  occurrence: string;
  preventiveAction: string;
  attentionPoint: string;
  // Número da ordem do RP ligado (DEMO_RPS), se houver.
  rpOrder: string | null;
};

export type DemoTechCard = {
  model: string;
  type: TechCardType;
  subassembly: string | null;
  code: string | null;
  title: string;
  summary: string;
  details: Record<string, string>;
  tags: string[];
};

const [ALIMENTACAO, TRANSPORTE, SELAGEM, PAINEL] = DEMO_SUBASSEMBLIES;

/**
 * Ocorrências depois de preventivas, com o ponto de atenção para a próxima.
 * @example DEMO_POST_PREVENTIVES[0].rpOrder // "0003"
 */
export const DEMO_POST_PREVENTIVES: readonly DemoPostPreventive[] = [
  {
    machine: "m3", subassembly: ALIMENTACAO, preventiveDaysAgo: 40, occurrenceDaysAgo: 36, members: ["c1", "c2"],
    done: "Limpeza e lubrificação do Subconjunto 1.", occurrence: "Vazamento de ar no cilindro quatro dias depois.",
    preventiveAction: "Trocar a vedação do cilindro em toda preventiva trimestral.",
    attentionPoint: "Conferir a vedação do cilindro e testar a pressão antes de liberar.", rpOrder: "0003",
  },
  {
    machine: "m5", subassembly: TRANSPORTE, preventiveDaysAgo: 50, occurrenceDaysAgo: 45, members: ["c4"],
    done: "Troca da correia e ajuste de tensão.", occurrence: "Ruído alto no Subconjunto 2.",
    preventiveAction: "Lubrificar as engrenagens a cada 15 dias.",
    attentionPoint: "Ouvir o Subconjunto 2 girando em vazio antes de liberar.", rpOrder: "0002",
  },
  {
    machine: "m6", subassembly: SELAGEM, preventiveDaysAgo: 25, occurrenceDaysAgo: 21, members: ["c6", "c7"],
    done: "Limpeza das barras de selagem.", occurrence: "Resistência queimou logo depois.",
    preventiveAction: "Medir a resistência elétrica das barras na preventiva.",
    attentionPoint: "Medir a resistência das barras e anotar o valor na folha.", rpOrder: "0005",
  },
  {
    machine: "m10", subassembly: PAINEL, preventiveDaysAgo: 14, occurrenceDaysAgo: 12, members: ["c9", "c10"],
    done: "Reaperto dos bornes do painel.", occurrence: "Um borne ficou sem reaperto e esquentou.",
    preventiveAction: "Usar a lista de bornes na hora do reaperto.",
    attentionPoint: "Seguir a lista de bornes e marcar cada um.", rpOrder: null,
  },
];

/**
 * Fichas curtas por modelo: códigos de alarme, peça, parâmetro e procedimento.
 * @example DEMO_TECH_CARDS.filter((card) => card.type === "error_code").map((card) => card.code) // ["A-001", "A-002", "A-003"]
 */
export const DEMO_TECH_CARDS: readonly DemoTechCard[] = [
  {
    model: "a", type: "error_code", subassembly: TRANSPORTE, code: "A-001", title: "Alarme 1: produto fora de posição",
    summary: "O sensor do Subconjunto 2 não viu o produto no tempo esperado.", tags: ["sensor", "transporte"],
    details: { meaning: "Produto atrasado na esteira.", cause: "Guia desalinhada ou sensor sujo.", action: "Limpar o sensor e conferir a guia." },
  },
  {
    model: "a", type: "error_code", subassembly: SELAGEM, code: "A-002", title: "Alarme 2: temperatura alta",
    summary: "A temperatura da selagem passou do limite.", tags: ["selagem"],
    details: { meaning: "Barra de selagem acima do limite.", cause: "Termopar descalibrado.", action: "Calibrar o termopar e reiniciar." },
  },
  {
    model: "b", type: "error_code", subassembly: PAINEL, code: "A-003", title: "Alarme 3: falha no inversor",
    summary: "O inversor do Subconjunto 2 parou por sobrecorrente.", tags: ["painel", "inversor"],
    details: { meaning: "Motor puxando corrente demais.", cause: "Rolamento travando.", action: "Girar o eixo à mão e trocar o rolamento se travar." },
  },
  {
    model: "b", type: "part", subassembly: TRANSPORTE, code: "P-0001", title: "Peça 1: correia do transporte",
    summary: "Correia dentada do Subconjunto 2.", tags: ["correia"],
    details: { quantity: "1", unit: "peça", position: "Item 12 do desenho", notes: "Usar só o código especificado." },
  },
  {
    model: "c", type: "parameter", subassembly: SELAGEM, code: "T-SEL", title: "Temperatura de selagem",
    summary: "Temperatura padrão das barras do Subconjunto 3.", tags: ["selagem"],
    details: { value: "180 °C", range: "170 a 190 °C", where: "Tela de receitas", effect: "Abaixo da faixa a embalagem abre." },
  },
  {
    model: "c", type: "procedure", subassembly: ALIMENTACAO, code: null, title: "Troca de formato do Subconjunto 1",
    summary: "Passo a passo para trocar o formato da alimentação.", tags: ["formato"],
    details: { when: "Sempre que mudar o produto.", steps: "1. Parar a máquina. 2. Trocar as guias. 3. Ajustar a altura. 4. Testar com 10 ciclos.", tools: "Chave allen 5 mm e gabarito de altura." },
  },
];
