import type { ProblemBoardItemDto } from "@manutencao/shared";
import type { NewProblemSpot } from "../data/board";

export const PROBLEM_MODES = ["linha", "maquina", "conjunto", "situacao"] as const;
export type ProblemMode = (typeof PROBLEM_MODES)[number];
export type ProblemPlaceMode = Exclude<ProblemMode, "situacao">;

export const problemModeOptions: { value: ProblemMode; label: string }[] = [
  { value: "linha", label: "Linha" },
  { value: "maquina", label: "Máquina" },
  { value: "conjunto", label: "Conjunto" },
  { value: "situacao", label: "Situação" },
];

export type ProblemPlaceGroup = {
  key: string;
  title: string;
  ids: string[];
  // Onde cai um problema adicionado no rodapé do grupo; nulo quando o grupo não aponta um lugar só.
  spot: NewProblemSpot | null;
};

const NO_PLACE: Record<ProblemPlaceMode, string> = { linha: "Sem linha", maquina: "Sem máquina", conjunto: "Sem conjunto" };
const NO_KEY = "sem";

/** "MED 03 · Encartuchadeira": o nome da máquina se repete entre linhas, então vai com a linha. */
export function machineTitle(item: ProblemBoardItemDto): string | null {
  if (!item.machineName) return null;
  return item.lineName ? `${item.lineName} · ${item.machineName}` : item.machineName;
}

function placeKey(item: ProblemBoardItemDto, mode: ProblemPlaceMode): string {
  if (mode === "linha") return item.lineName ?? NO_KEY;
  if (mode === "maquina") return item.machineId ?? NO_KEY;
  return item.subassemblyId ?? NO_KEY;
}

function placeTitle(item: ProblemBoardItemDto, mode: ProblemPlaceMode): string {
  const title = mode === "linha" ? item.lineName : mode === "maquina" ? machineTitle(item) : item.subassemblyName;
  return title ?? NO_PLACE[mode];
}

// Um subconjunto vale para todas as máquinas do modelo: o rodapé só sabe onde lançar se o grupo tem uma máquina só.
function placeSpot(members: ProblemBoardItemDto[], mode: ProblemPlaceMode): NewProblemSpot | null {
  const first = members[0];
  if (placeKey(first, mode) === NO_KEY) return null;
  if (mode === "linha") return first.lineId ? { lineId: first.lineId } : null;
  if (mode === "maquina") return { lineId: first.lineId, machineId: first.machineId };
  const oneMachine = members.every((item) => item.machineId === first.machineId);
  return oneMachine ? { lineId: first.lineId, machineId: first.machineId, subassemblyId: first.subassemblyId } : null;
}

/**
 * Agrupa os problemas abertos pelo lugar escolhido, em ordem alfabética, com o "Sem …" por último.
 * Ex.: `placeGroups(open, "maquina")` → `[{ key: "maquina:m1", title: "MED 03 · Encartuchadeira", ids, spot }, …]`
 */
export function placeGroups(items: ProblemBoardItemDto[], mode: ProblemPlaceMode): ProblemPlaceGroup[] {
  const byKey = new Map<string, ProblemBoardItemDto[]>();
  for (const item of items) {
    const key = placeKey(item, mode);
    byKey.set(key, [...(byKey.get(key) ?? []), item]);
  }
  const groups = [...byKey].map(([key, members]) => ({
    key: `${mode}:${key}`,
    title: placeTitle(members[0], mode),
    ids: members.map((item) => item.id),
    spot: placeSpot(members, mode),
    unplaced: key === NO_KEY,
  }));
  groups.sort((a, b) => Number(a.unplaced) - Number(b.unplaced) || a.title.localeCompare(b.title, "pt-BR"));
  return groups.map(({ unplaced: _unplaced, ...group }) => group);
}

function joinPlace(parts: (string | null)[]): string | undefined {
  return parts.filter(Boolean).join(" › ") || undefined;
}

/**
 * Lugar mostrado na linha do problema, sem repetir o que o título do grupo já diz.
 * Ex.: no modo Máquina, o problema da "MED 03 · Encartuchadeira" mostra só o conjunto ("Válvulas roletes").
 */
export function placeTag(item: ProblemBoardItemDto, mode: ProblemMode, groupKey: string): string | undefined {
  const grouped = mode !== "situacao" && groupKey.startsWith(`${mode}:`) && groupKey !== `${mode}:${NO_KEY}`;
  if (!grouped) return joinPlace([machineTitle(item) ?? item.lineName, item.subassemblyName]);
  if (mode === "linha") return joinPlace([item.machineName, item.subassemblyName]);
  if (mode === "maquina") return joinPlace([item.subassemblyName]);
  return joinPlace([machineTitle(item) ?? item.lineName]);
}
