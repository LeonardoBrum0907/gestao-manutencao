import type { TeamMatrixDto, TeamMatrixLayoutDto, TeamMemberDto } from "@manutencao/shared";
import { teamColumnBlocks, type TeamColumn, type TeamColumnBlock } from "./team-columns";
import type { TeamFocus } from "./team-insights";
import { sortMembers, teamRowBlocks, type TeamRowBlock, type TeamSort } from "./team-rows";

// Tudo que define a grade: a disposição salva no sistema e os filtros da tela (turno, números do topo, linhas, ordem).
export type TeamGridState = { layout: TeamMatrixLayoutDto; shift: string; focus: TeamFocus | null; lineIds: readonly string[]; sort: TeamSort };

export type TeamGrid = { columnBlocks: TeamColumnBlock[]; columns: TeamColumn[]; rowBlocks: TeamRowBlock[]; memberCount: number };

function visibleMembers(members: readonly TeamMemberDto[], shift: string, focus: TeamFocus | null): TeamMemberDto[] {
  return members.filter((member) => (!shift || member.shift === shift) && (focus !== "pdi" || member.pdiOverdue > 0));
}

/**
 * Monta a grade da Matriz da equipe do mesmo jeito para a tela, a folha A4 e a planilha: o que se vê é o que se exporta.
 * @example teamGrid(team, { layout: team.layout, shift: "", focus: null, lineIds: [], sort: { key: "name", dir: 1 } })
 */
export function teamGrid(team: TeamMatrixDto, state: TeamGridState): TeamGrid {
  const status = state.focus && state.focus !== "pdi" ? state.focus : null;
  const columnBlocks = teamColumnBlocks(team, state.layout.columnGroup, state.layout.columnOrder, { status, lineIds: state.lineIds });
  const members = sortMembers(visibleMembers(team.members, state.shift, state.focus), state.sort, team.qualifiedAdherence);
  return {
    columnBlocks,
    columns: columnBlocks.flatMap((block) => block.columns),
    rowBlocks: teamRowBlocks(members, state.layout.rowGroup),
    memberCount: members.length,
  };
}

/**
 * Arrastar colunas só sem filtro de colunas: com parte dos irmãos escondida, a ordem arrastada ficaria ambígua.
 * @example canDragColumns({ lineIds: [], focus: "pdi" }) // true
 */
export function canDragColumns(state: Pick<TeamGridState, "lineIds" | "focus">): boolean {
  return state.lineIds.length === 0 && (state.focus === null || state.focus === "pdi");
}
