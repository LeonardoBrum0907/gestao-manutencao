import { isMatrixCategory, type MatrixCategory, type TeamMatrixView } from "@manutencao/shared";
import { viewPreset, type TeamFocus } from "./team-insights";
import type { TeamSort, TeamSortKey } from "./team-rows";

// Filtros da tela que não ficam salvos vão no endereço: voltar para a tela os mantém e a folha A4 abre igual.
// category vai para a API (?categoria=): ela devolve só quem vê a categoria e só as habilidades dela.
export type TeamSearchState = {
  shift: string;
  focus: TeamFocus | null;
  lineIds: string[];
  memberIds: string[];
  category: MatrixCategory | null;
  sort: TeamSort;
};

const FOCUSES: readonly TeamFocus[] = ["none", "short", "single", "pdi"];

function readList(search: URLSearchParams, name: string): string[] {
  return (search.get(name) ?? "").split(",").filter(Boolean);
}

function readSortKey(value: string | null): TeamSortKey | null {
  if (value === "name" || value === "count") return value;
  return value?.startsWith("equipment:") ? (value as TeamSortKey) : null;
}

/**
 * Categoria escolhida na Matriz da equipe (mecânico ou eletricista); fora do formato vale a equipe toda.
 * @example readTeamCategory(new URLSearchParams("categoria=electrical")) // "electrical"
 */
export function readTeamCategory(search: URLSearchParams): MatrixCategory | null {
  const value = search.get("categoria");
  return isMatrixCategory(value) ? value : null;
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
    lineIds: readList(search, "linhas"),
    memberIds: readList(search, "tecnicos"),
    category: readTeamCategory(search),
    sort: key ? { key, dir: search.get("sentido") === "desc" ? -1 : 1 } : viewPreset(view).sort,
  };
}

/**
 * Grava os filtros no endereço, deixando de fora o que está vazio.
 * @example writeTeamSearch({ shift: "first", focus: null, lineIds: [], memberIds: [], category: null, sort: { key: "name", dir: 1 } }).toString() // "turno=first&ordem=name&sentido=asc"
 */
export function writeTeamSearch(state: TeamSearchState): URLSearchParams {
  const search = new URLSearchParams();
  if (state.shift) search.set("turno", state.shift);
  if (state.focus) search.set("foco", state.focus);
  if (state.lineIds.length) search.set("linhas", state.lineIds.join(","));
  if (state.memberIds.length) search.set("tecnicos", state.memberIds.join(","));
  if (state.category) search.set("categoria", state.category);
  search.set("ordem", state.sort.key);
  search.set("sentido", state.sort.dir === -1 ? "desc" : "asc");
  return search;
}
