// O que o gestor deixou aberto ou recolhido na Matriz do colaborador, guardado no aparelho.
// Vale para todos os colaboradores: quem recolheu um subconjunto não quer reabrir em cada ficha.

/** Só o que a matriz usa do localStorage, para os testes trocarem por uma classe falsa. */
export type MatrixFoldStorage = Pick<Storage, "getItem" | "setItem">;

const OPEN_EQUIPMENT_KEY = "matriz.equipamento-aberto";
const COLLAPSED_SUBGROUPS_KEY = "matriz.subconjuntos-recolhidos";

/**
 * Chave de um subconjunto dentro do equipamento: o mesmo nome pode existir em equipamentos diferentes.
 * @example subgroupFoldKey("eq1", "Desbobinador") // '["eq1","Desbobinador"]'
 */
export function subgroupFoldKey(equipment: string, subgroup: string): string {
  return JSON.stringify([equipment, subgroup]);
}

function readJson(storage: MatrixFoldStorage | null, key: string): unknown {
  try {
    const stored = storage?.getItem(key);
    return stored === null || stored === undefined ? undefined : JSON.parse(stored);
  } catch {
    return undefined;
  }
}

function writeJson(storage: MatrixFoldStorage | null, key: string, value: unknown): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento (aba anônima): vale só nesta visita.
  }
}

/**
 * Subconjuntos recolhidos guardados no aparelho. Sem nada guardado (ou guardado estragado), todos abertos.
 * @example readCollapsedSubgroups(deviceStorage()).has(subgroupFoldKey("eq1", "Desbobinador"))
 */
export function readCollapsedSubgroups(storage: MatrixFoldStorage | null): ReadonlySet<string> {
  const stored = readJson(storage, COLLAPSED_SUBGROUPS_KEY);
  if (!Array.isArray(stored)) return new Set();
  return new Set(stored.filter((item): item is string => typeof item === "string"));
}

/**
 * Recolhe o subconjunto se estava aberto, abre se estava recolhido, e guarda no aparelho.
 * @example const next = toggleCollapsedSubgroup(deviceStorage(), current, subgroupFoldKey("eq1", "Desbobinador"))
 */
export function toggleCollapsedSubgroup(storage: MatrixFoldStorage | null, current: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(current);
  if (!next.delete(key)) next.add(key);
  writeJson(storage, COLLAPSED_SUBGROUPS_KEY, [...next]);
  return next;
}

/**
 * Equipamento aberto da última vez: o id, null quando o gestor fechou todos, undefined quando nunca escolheu.
 * @example readOpenEquipment(deviceStorage()) // "eq1"
 */
export function readOpenEquipment(storage: MatrixFoldStorage | null): string | null | undefined {
  const stored = readJson(storage, OPEN_EQUIPMENT_KEY);
  return stored === null || typeof stored === "string" ? stored : undefined;
}

/**
 * Guarda o equipamento aberto (null = todos fechados).
 * @example saveOpenEquipment(deviceStorage(), "eq1")
 */
export function saveOpenEquipment(storage: MatrixFoldStorage | null, equipment: string | null): void {
  writeJson(storage, OPEN_EQUIPMENT_KEY, equipment);
}

/**
 * Qual equipamento abre ao entrar na matriz. O ?equipamento= da Matriz da equipe manda; depois o guardado,
 * se o colaborador tem esse equipamento; senão o primeiro dele, como antes.
 * @example initialOpenEquipment(["eq1", "eq2"], null, "eq2") // "eq2"
 */
export function initialOpenEquipment(equipments: readonly string[], wanted: string | null, stored: string | null | undefined): string | null {
  if (wanted && equipments.includes(wanted)) return wanted;
  if (stored === null) return null;
  if (stored && equipments.includes(stored)) return stored;
  return equipments[0] ?? null;
}
