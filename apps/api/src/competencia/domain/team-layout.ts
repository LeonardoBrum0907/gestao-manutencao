import {
  TEAM_COLUMN_GROUPS,
  TEAM_LAYOUT_ID_MAX,
  TEAM_LAYOUT_ORDER_MAX,
  TEAM_MATRIX_VIEWS,
  TEAM_ROW_GROUPS,
  type TeamLineDto,
  type TeamMatrixLayoutDto,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";

function requireChoice<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (typeof value === "string" && (options as readonly string[]).includes(value)) return value as T;
  throw new DomainError("invalid", 400, `${field} inválido: recebido ${JSON.stringify(value)}, esperado um de ${options.join(", ")}.`);
}

function requireColumnOrder(value: unknown): string[] {
  const valid = Array.isArray(value) && value.length <= TEAM_LAYOUT_ORDER_MAX;
  if (!valid || !value.every((id) => typeof id === "string" && id.length > 0 && id.length <= TEAM_LAYOUT_ID_MAX)) {
    throw new DomainError("invalid", 400, `columnOrder inválido: esperado uma lista de até ${TEAM_LAYOUT_ORDER_MAX} ids de texto.`);
  }
  return [...new Set(value as string[])];
}

/**
 * Lê o corpo do PUT da disposição da Matriz da equipe. Todos os campos são obrigatórios: a tela manda a disposição inteira.
 * @example parseTeamLayout({ view: "schedule", rowGroup: "shift", columnGroup: "line", columnOrder: ["l1", "m1"] })
 */
export function parseTeamLayout(body: unknown): TeamMatrixLayoutDto {
  const input = readObject(body);
  return {
    view: requireChoice(input.view, TEAM_MATRIX_VIEWS, "view"),
    rowGroup: requireChoice(input.rowGroup, TEAM_ROW_GROUPS, "rowGroup"),
    columnGroup: requireChoice(input.columnGroup, TEAM_COLUMN_GROUPS, "columnGroup"),
    columnOrder: requireColumnOrder(input.columnOrder),
  };
}

export type TeamLineInput = {
  id: string;
  name: string;
  factoryName: string;
  machines: { id: string; name: string; equipmentId: string | null }[];
};

/**
 * Linhas para as colunas da Matriz da equipe: só as máquinas cujo modelo está ativo no catálogo (as outras não têm
 * matriz de habilidades) e só as linhas que ficam com alguma máquina.
 * @example teamLines([{ id: "l1", name: "CAM 05", factoryName: "F1", machines: [{ id: "m1", name: "Blister", equipmentId: "e1" }] }], ["e1"])
 */
export function teamLines(lines: readonly TeamLineInput[], activeEquipmentIds: readonly string[]): TeamLineDto[] {
  const active = new Set(activeEquipmentIds);
  return lines
    .map((line) => ({
      ...line,
      machines: line.machines.flatMap((machine) =>
        machine.equipmentId && active.has(machine.equipmentId) ? [{ id: machine.id, name: machine.name, equipmentId: machine.equipmentId }] : [],
      ),
    }))
    .filter((line) => line.machines.length > 0);
}
