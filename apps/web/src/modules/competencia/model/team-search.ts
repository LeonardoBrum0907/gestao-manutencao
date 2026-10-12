import type { TeamMatrixView } from "@manutencao/shared";
import { viewPreset, type TeamFocus } from "./team-insights";
import type { TeamSort, TeamSortKey } from "./team-rows";

// Filtros da tela que não ficam salvos vão no endereço: voltar para a tela os mantém e a folha A4 abre igual.
export type TeamSearchState = { shift: string; focus: TeamFocus | null; lineIds: string[]; sort: TeamSort };

const FOCUSES: readonly TeamFocus[] = ["none", "short", "single", "pdi"];

function readSortKey(value: string | null): TeamSortKey | null {
  if (value === "name" || value === "count") return value;
  return value?.startsWith("equipment:") ? (value as TeamSortKey) : null;
}

/**
 * Lê os filtros do endereço; sem ordem no endereço vale a da visão escolhida.
 * @example readTeamSearch(new URLSearchParams("turno=first&foco=none"), "training")
 */
export function readTeamSearch(search: URLSearchParams, view: TeamMatrixView): TeamSearchState {
  const focus = search.get("foco");
  const key = readSortKey(search.get("ordem"));
  return {
    shift: search.get("turno") ?? "",
    focus: FOCUSES.includes(focus as TeamFocus) ? (focus as TeamFocus) : null,
    lineIds: (search.get("linhas") ?? "").split(",").filter(Boolean),
    sort: key ? { key, dir: search.get("sentido") === "desc" ? -1 : 1 } : viewPreset(view).sort,
  };
}

/**
 * Grava os filtros no endereço, deixando de fora o que está vazio.
 * @example writeTeamSearch({ shift: "first", focus: null, lineIds: [], sort: { key: "name", dir: 1 } }).toString() // "turno=first&ordem=name&sentido=asc"
 */
export function writeTeamSearch(state: TeamSearchState): URLSearchParams {
  const search = new URLSearchParams();
  if (state.shift) search.set("turno", state.shift);
  if (state.focus) search.set("foco", state.focus);
  if (state.lineIds.length) search.set("linhas", state.lineIds.join(","));
  search.set("ordem", state.sort.key);
  search.set("sentido", state.sort.dir === -1 ? "desc" : "asc");
  return search;
}
