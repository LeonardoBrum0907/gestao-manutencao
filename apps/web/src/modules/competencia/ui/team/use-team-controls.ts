import { useSearchParams } from "react-router-dom";
import type { TeamMatrixDto, TeamMatrixLayoutDto, TeamMatrixView } from "@manutencao/shared";
import { useSaveTeamLayout } from "../../data/matrix";
import type { TeamGridState } from "../../model/team-grid";
import { viewPreset } from "../../model/team-insights";
import { readTeamSearch, writeTeamSearch, type TeamSearchState } from "../../model/team-search";

export type TeamControls = TeamGridState & {
  search: URLSearchParams;
  setSearch: (next: Partial<TeamSearchState>) => void;
  saveLayout: (next: Partial<TeamMatrixLayoutDto>) => void;
  chooseView: (view: TeamMatrixView) => void;
  saveFailed: boolean;
};

/**
 * Estado da Matriz da equipe: a disposição salva no sistema (visão, agrupamentos, ordem das colunas) e os filtros
 * do endereço (turno, números do topo, linhas, ordem dos técnicos).
 * @example const controls = useTeamControls(team); controls.chooseView("schedule");
 */
export function useTeamControls(team: TeamMatrixDto): TeamControls {
  const [search, setSearchParams] = useSearchParams();
  const save = useSaveTeamLayout();
  const layout = team.layout;
  const state = readTeamSearch(search, layout.view);
  const setSearch = (next: Partial<TeamSearchState>) => setSearchParams(writeTeamSearch({ ...state, ...next }), { replace: true });
  const saveLayout = (next: Partial<TeamMatrixLayoutDto>) => save.mutate({ ...layout, ...next });
  // A visão é um atalho: agrupa e ordena os técnicos do jeito do uso. Depois dá para mudar à mão.
  const chooseView = (view: TeamMatrixView) => {
    const preset = viewPreset(view);
    saveLayout({ view, rowGroup: preset.rowGroup });
    setSearch({ sort: preset.sort });
  };
  return { ...state, layout, search: writeTeamSearch(state), setSearch, saveLayout, chooseView, saveFailed: save.isError };
}
