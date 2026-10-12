// Como o gestor deixou a Matriz da equipe: a visão escolhida, os agrupamentos e a ordem das colunas que ele arrastou.
// Fica salvo no sistema (não no navegador) para valer igual no PC e no celular.

// Visões prontas: cada uma ajusta a grade para um uso (decidir quem treinar, montar a escala, apresentar para a gerência).
export const TEAM_MATRIX_VIEWS = ["training", "schedule", "management"] as const;
export type TeamMatrixView = (typeof TEAM_MATRIX_VIEWS)[number];

export const TEAM_MATRIX_VIEW_LABELS: Record<TeamMatrixView, string> = {
  training: "Treino",
  schedule: "Escala",
  management: "Gerência",
};

// Linhas da grade (técnicos) agrupadas por turno, grau, equipe ou soltas.
export const TEAM_ROW_GROUPS = ["shift", "grade", "team", "none"] as const;
export type TeamRowGroup = (typeof TEAM_ROW_GROUPS)[number];

export const TEAM_ROW_GROUP_LABELS: Record<TeamRowGroup, string> = {
  shift: "Turno",
  grade: "Grau",
  team: "Equipe",
  none: "Não agrupar",
};

// Colunas da grade: as máquinas cadastradas agrupadas por linha, ou uma coluna por modelo de equipamento.
export const TEAM_COLUMN_GROUPS = ["line", "model"] as const;
export type TeamColumnGroup = (typeof TEAM_COLUMN_GROUPS)[number];

export const TEAM_COLUMN_GROUP_LABELS: Record<TeamColumnGroup, string> = {
  line: "Linhas e máquinas",
  model: "Modelo de equipamento",
};

export type TeamMatrixLayoutDto = {
  view: TeamMatrixView;
  rowGroup: TeamRowGroup;
  columnGroup: TeamColumnGroup;
  // Ids de linha, máquina e modelo na ordem arrastada. Id que não existe mais é ignorado; o que não está aqui vai para o fim.
  columnOrder: string[];
};

export const DEFAULT_TEAM_MATRIX_LAYOUT: TeamMatrixLayoutDto = {
  view: "training",
  rowGroup: "shift",
  columnGroup: "line",
  columnOrder: [],
};

// Limites da ordem salva: cobre com folga as linhas, máquinas e modelos de uma fábrica e barra corpo absurdo.
export const TEAM_LAYOUT_ORDER_MAX = 2000;
export const TEAM_LAYOUT_ID_MAX = 64;

// Linha cadastrada com as máquinas que têm modelo (só elas têm matriz de habilidades).
export type TeamLineDto = {
  id: string;
  name: string;
  factoryName: string;
  machines: { id: string; name: string; equipmentId: string }[];
};
