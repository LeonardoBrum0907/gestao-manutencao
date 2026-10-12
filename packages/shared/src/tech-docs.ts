// Documentação técnica por máquina: documentos (PDFs guardados no servidor) e fichas de conhecimento
// curtas extraídas deles, para a busca devolver a resposta sem percorrer o manual.

// Tipo de ficha. Cada um tem os seus campos em `details`; os campos comuns ficam na ficha.
export const TECH_CARD_TYPES = ["error_code", "interface", "signal", "part", "parameter", "procedure"] as const;
export type TechCardType = (typeof TECH_CARD_TYPES)[number];

export const TECH_CARD_TYPE_LABELS: Record<TechCardType, { one: string; many: string }> = {
  error_code: { one: "Código de erro", many: "Códigos de erro e alarmes" },
  interface: { one: "Interface", many: "Interfaces com outras máquinas" },
  signal: { one: "Sinal / dispositivo", many: "Sinais e dispositivos" },
  part: { one: "Peça", many: "Peças" },
  parameter: { one: "Parâmetro", many: "Parâmetros" },
  procedure: { one: "Procedimento", many: "Procedimentos" },
};

export function isTechCardType(value: string): value is TechCardType {
  return (TECH_CARD_TYPES as readonly string[]).includes(value);
}

// Campos próprios de cada tipo, na ordem em que aparecem na ficha. A chave é o que vai em `details`.
export type TechCardDetailField = { key: string; label: string; long?: boolean };

export const TECH_CARD_DETAIL_FIELDS: Record<TechCardType, TechCardDetailField[]> = {
  error_code: [
    { key: "meaning", label: "O que significa", long: true },
    { key: "cause", label: "Causa provável", long: true },
    { key: "action", label: "O que fazer", long: true },
  ],
  interface: [
    { key: "from", label: "De (máquina)" },
    { key: "to", label: "Para (máquina)" },
    { key: "how", label: "Como funciona", long: true },
    { key: "medium", label: "Sinal / meio" },
    { key: "commands", label: "Quem comanda" },
    { key: "responsible", label: "Responsável" },
    { key: "disable", label: "Como desligar a ligação", long: true },
    { key: "symptom", label: "Sintoma típico", long: true },
  ],
  signal: [
    { key: "function", label: "Função", long: true },
    { key: "address", label: "Endereço / entrada" },
    { key: "location", label: "Onde está" },
    { key: "symptom", label: "Sintoma quando falha", long: true },
  ],
  part: [
    { key: "quantity", label: "Quantidade" },
    { key: "unit", label: "Unidade" },
    { key: "position", label: "Posição no desenho" },
    { key: "notes", label: "Observações", long: true },
  ],
  parameter: [
    { key: "value", label: "Valor padrão" },
    { key: "range", label: "Faixa" },
    { key: "where", label: "Onde ajustar" },
    { key: "effect", label: "Efeito", long: true },
  ],
  procedure: [
    { key: "when", label: "Quando fazer", long: true },
    { key: "steps", label: "Passos", long: true },
    { key: "tools", label: "Ferramentas e cuidados", long: true },
  ],
};

// Tipo do documento, só para a lista: o arquivo é sempre um PDF ou imagem.
export const TECH_DOCUMENT_KINDS = ["operator_manual", "parts_catalog", "electrical_schematic", "other"] as const;
export type TechDocumentKind = (typeof TECH_DOCUMENT_KINDS)[number];

export const TECH_DOCUMENT_KIND_LABELS: Record<TechDocumentKind, string> = {
  operator_manual: "Manual do operador",
  parts_catalog: "Catálogo de peças",
  electrical_schematic: "Esquema elétrico",
  other: "Outro",
};

export function isTechDocumentKind(value: string): value is TechDocumentKind {
  return (TECH_DOCUMENT_KINDS as readonly string[]).includes(value);
}

// Limite do arquivo do documento (manuais são grandes; os anexos comuns ficam em 10 MB).
export const TECH_DOCUMENT_MAX_BYTES = 200 * 1024 * 1024;

export type TechDocumentDto = {
  id: string;
  equipmentId: string;
  name: string;
  kind: TechDocumentKind;
  fileName: string;
  mimeType: string;
  size: number;
  revision: string | null;
  cardCount: number;
  createdAt: string;
};

export type TechDocumentFields = {
  equipmentId: string;
  name: string;
  kind: TechDocumentKind;
  revision: string | null;
};

// Para quem vale a ficha: um modelo (todas as máquinas iguais), uma máquina ou uma linha. Só um deles vem preenchido.
export type TechCardScope = {
  equipmentId: string | null;
  machineId: string | null;
  lineId: string | null;
};

export type TechCardFields = TechCardScope & {
  type: TechCardType;
  subassemblyId: string | null;
  // Código de erro, nº de peça, tag do sinal ou nome do parâmetro: o que o técnico digita na busca.
  code: string | null;
  title: string;
  summary: string;
  details: Record<string, string>;
  deviceTag: string | null;
  // Como está escrito no manual, em alemão ou inglês, para a busca achar pelo termo original.
  originalTerm: string | null;
  tags: string[];
  documentId: string | null;
  page: number | null;
  // Folha ou coluna do esquema elétrico, quando a página não basta.
  sheet: string | null;
  // Criada pela IA com dúvida: o coordenador confere antes de confiar.
  reviewNeeded: boolean;
};

export type TechCardDto = TechCardFields & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

// Resultado da busca: a ficha e, resolvidos, os nomes de onde ela vale e do documento.
export type TechCardHit = TechCardDto & {
  scopeLabel: string;
  subassemblyName: string | null;
  documentName: string | null;
  // Acerto exato de código ou nº de peça: vai para o alto da lista.
  exact: boolean;
};

export type TechCardSearchDto = {
  hits: TechCardHit[];
  // Fichas pós-preventiva que também batem com a busca, no fim da lista.
  postPreventiveIds: string[];
  total: number;
};

// Contagem por tipo de uma máquina (valem para ela as fichas do modelo, da máquina e da linha).
export type TechCardSummaryDto = {
  machineId: string;
  counts: Record<TechCardType, number>;
  total: number;
};
