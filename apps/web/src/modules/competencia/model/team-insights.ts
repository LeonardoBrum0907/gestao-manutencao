import type { TeamCoverageStatus, TeamMatrixDto, TeamMatrixView, TeamRowGroup } from "@manutencao/shared";
import { alertsOf } from "./team";
import { cellOf, type TeamSort } from "./team-rows";

// "Perto do corte": até 10 pontos abaixo da aderência que qualifica. É a melhor aposta para treinar primeiro.
export const NEAR_CUT_GAP = 10;

// Filtro dos números do topo: um status de cobertura (filtra modelos) ou PDI atrasado (filtra técnicos).
export type TeamFocus = Exclude<TeamCoverageStatus, "ok"> | "pdi";

export type TeamKpis = { covered: number; total: number; none: number; short: number; single: number; pdiLate: number };

/**
 * Números do topo da Matriz da equipe, contados por modelo de equipamento.
 * @example teamKpis(team) // { covered: 6, total: 9, none: 1, short: 1, single: 1, pdiLate: 3 }
 */
export function teamKpis(team: TeamMatrixDto): TeamKpis {
  const count = (status: TeamCoverageStatus) => team.equipments.filter((equipment) => equipment.status === status).length;
  return {
    covered: count("ok"),
    total: team.equipments.length,
    none: count("none"),
    short: count("short"),
    single: count("single"),
    pdiLate: team.members.filter((member) => member.pdiOverdue > 0).length,
  };
}

export type TrainingCandidate = { memberId: string; name: string; shift: string; adherence: number; gap: number };
export type TrainingNeed = { equipmentId: string; name: string; status: TeamCoverageStatus; qualified: number; minQualified: number; candidates: TrainingCandidate[] };

/**
 * Para cada modelo em risco (do mais grave para o menos), os técnicos com nota mais perto do corte.
 * @example trainingNeeds(team, 3)[0] // { name: "Encaixotadora Mediseal", status: "none", candidates: [{ name: "Renata", adherence: 78, gap: 2 }] }
 */
export function trainingNeeds(team: TeamMatrixDto, limit = 3): TrainingNeed[] {
  const cut = team.qualifiedAdherence;
  return alertsOf(team).map((equipment) => {
    const candidates = team.members
      .flatMap((member) => {
        const adherence = cellOf(member, equipment.id)?.adherence;
        if (adherence == null || adherence >= cut) return [];
        return [{ memberId: member.id, name: member.name, shift: member.shift, adherence, gap: cut - adherence }];
      })
      .sort((a, b) => a.gap - b.gap || a.name.localeCompare(b.name))
      .slice(0, limit);
    const { id, name, status, qualified, minQualified } = equipment;
    return { equipmentId: id, name, status, qualified, minQualified, candidates };
  });
}

/**
 * O que cada visão ajusta: agrupamento dos técnicos e ordem. As colunas (linhas ou modelos) ficam como o gestor deixou.
 * @example viewPreset("management") // { rowGroup: "none", sort: { key: "count", dir: -1 } }
 */
export function viewPreset(view: TeamMatrixView): { rowGroup: TeamRowGroup; sort: TeamSort } {
  if (view === "management") return { rowGroup: "none", sort: { key: "count", dir: -1 } };
  return { rowGroup: "shift", sort: { key: "name", dir: 1 } };
}

export type CellTone = "qualified" | "near" | "below" | "unscored";

/**
 * Tom da célula: qualificado, perto do corte, abaixo ou sem nota. "Perto" só aparece na visão de treino.
 * @example cellTone(74, 5, 80, "training") // "near"
 */
export function cellTone(adherence: number | null, scored: number, cut: number, view: TeamMatrixView): CellTone {
  if (scored === 0 || adherence === null) return "unscored";
  if (adherence >= cut) return "qualified";
  if (view === "training" && cut - adherence <= NEAR_CUT_GAP) return "near";
  return "below";
}
