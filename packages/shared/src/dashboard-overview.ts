// Dashboard do coordenador (redesenho de 2026-10-12, opção A): três faixas, Agora, Máquinas e Equipe.
// Cobertura da matriz, quem treinar e PDI vencido vêm da Matriz da equipe; aqui fica o resto.

// Períodos da faixa Máquinas, em dias corridos até hoje.
export const DASHBOARD_PERIODS = [7, 30, 90] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export function isDashboardPeriod(value: number): value is DashboardPeriod {
  return DASHBOARD_PERIODS.some((period) => period === value);
}

// Sem feedback há mais que isto conta em "sem feedback".
export const FEEDBACK_SILENCE_DAYS = 60;

export type DashboardChamadoDto = {
  id: string;
  dayNumber: number | null;
  body: string;
  lineName: string | null;
  machineName: string | null;
  openedAt: string;
};

export type DashboardNowDto = {
  // Chamados não liberados, do aberto há mais tempo para o mais novo.
  openChamados: DashboardChamadoDto[];
  overdueTasks: number;
  overdueHighTasks: number;
  dueTodayTasks: number;
  stoppedLines: { id: string; name: string }[];
  // Linhas em implantação, teste ou ajuste.
  settingUpLines: number;
  drafts: number;
  oldestDraftAt: string | null;
  rpsInAnalysis: number;
  rpsWithoutRootCause: number;
};

// Semana começa na segunda-feira, no fuso do gestor. weekStart = "AAAA-MM-DD".
export type DashboardFlowWeekDto = { weekStart: string; created: number; completed: number };
export type DashboardChamadoWeekDto = { weekStart: string; count: number };

export type DashboardParetoDto = { key: string; label: string; count: number; minutes: number };
export type DashboardRepeatDto = { machineId: string; label: string; subassembly: string | null; count: number };
export type DashboardFourMDto = { rps: number; material: number; machine: number; method: number; labor: number };

export type DashboardMachinesDto = {
  days: DashboardPeriod;
  chamados: number;
  previousChamados: number;
  // Média entre abrir e fechar, só dos chamados fechados. Nulo sem nenhum fechado.
  avgMinutes: number | null;
  previousAvgMinutes: number | null;
  weekly: DashboardChamadoWeekDto[];
  pareto: DashboardParetoDto[];
  repeats: DashboardRepeatDto[];
  fourM: DashboardFourMDto;
};

export type DashboardEvaluationDto = {
  year: number;
  quarter: number;
  technicians: number;
  missing: number;
  belowTarget: number;
  target: number;
};

export type DashboardPeopleDto = {
  away: { id: string; name: string; status: string }[];
  evaluation: DashboardEvaluationDto;
  silentFeedback: { id: string; name: string }[];
};

export type DashboardOverviewDto = {
  generatedAt: string;
  factoryId: string | null;
  now: DashboardNowDto;
  flow: DashboardFlowWeekDto[];
  machines: DashboardMachinesDto;
  people: DashboardPeopleDto;
};
