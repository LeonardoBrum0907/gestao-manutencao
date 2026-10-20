import type { TeamMatrixDto, TeamMatrixLayoutDto, TeamMemberDto } from "@manutencao/shared";
import { teamColumnBlocks, type TeamColumn, type TeamColumnBlock } from "./team-columns";
import type { TeamFocus } from "./team-insights";
import { sortMembers, teamRowBlocks, type TeamRowBlock, type TeamSort } from "./team-rows";

// Tudo que define a grade: a disposição salva no sistema e os filtros da tela (turno, números do topo, linhas, técnicos, ordem).
export type TeamGridState = {
  layout: TeamMatrixLayoutDto;
  shift: string;
  focus: TeamFocus | null;
  lineIds: readonly string[];
  memberIds: readonly string[];
  sort: TeamSort;
};

export type TeamGrid = { columnBlocks: TeamColumnBlock[]; columns: TeamColumn[]; rowBlocks: TeamRowBlock[]; memberCount: number };

// Aviso da grade quando os filtros não deixam nenhum técnico.
export const EMPTY_TEAM_GRID_TEXT = "Nenhum técnico ativo com esses filtros.";

/**
 * Aviso no lugar da grade da folha A4 quando os filtros não deixam técnico; null quando há alguém.
 * Antes a folha saía só com o cabeçalho da grade, sem dizer por quê.
 * @example emptyTeamGridNotice({ memberCount: 0 }) // "Nenhum técnico ativo com esses filtros."
 */
export function emptyTeamGridNotice(grid: Pick<TeamGrid, "memberCount">): string | null {
  return grid.memberCount ? null : EMPTY_TEAM_GRID_TEXT;
}

type MemberFilter = Pick<TeamGridState, "shift" | "focus" | "memberIds">;

// Sem técnico escolhido valem todos; com escolha, só eles, para comparar lado a lado. Só conta a escolha de quem
// veio na equipe: a Categoria esconde técnicos e o filtro "Técnicos" não lista os escondidos, então mostrava
// "Todos" com a grade vazia.
function visibleMembers(members: readonly TeamMemberDto[], filter: MemberFilter): TeamMemberDto[] {
  const chosen = filter.memberIds.filter((id) => members.some((member) => member.id === id));
  return members.filter(
    (member) =>
      (!filter.shift || member.shift === filter.shift) &&
      (filter.focus !== "pdi" || member.pdiOverdue > 0) &&
      (chosen.length === 0 || chosen.includes(member.id)),
  );
}

/**
 * Monta a grade da Matriz da equipe do mesmo jeito para a tela, a folha A4 e a planilha: o que se vê é o que se exporta.
 * @example teamGrid(team, { layout: team.layout, shift: "", focus: null, lineIds: [], memberIds: [], sort: { key: "name", dir: 1 } })
 */
export function teamGrid(team: TeamMatrixDto, state: TeamGridState): TeamGrid {
  const status = state.focus && state.focus !== "pdi" ? state.focus : null;
  const columnBlocks = teamColumnBlocks(team, state.layout.columnGroup, state.layout.columnOrder, { status, lineIds: state.lineIds });
  const members = sortMembers(visibleMembers(team.members, state), state.sort, team.qualifiedAdherence);
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
