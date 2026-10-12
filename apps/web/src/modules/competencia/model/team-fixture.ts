import { DEFAULT_TEAM_MATRIX_LAYOUT, type TeamMatrixDto, type TeamMemberDto } from "@manutencao/shared";

// Equipe de exemplo para os testes da Matriz da equipe: 3 modelos, 2 linhas e 4 técnicos.
type CellInput = [equipmentId: string, adherence: number | null];

export function teamMember(id: string, shift: string, cells: CellInput[], extra: Partial<TeamMemberDto> = {}): TeamMemberDto {
  return {
    id,
    name: id,
    shift,
    teamId: null,
    gradeName: null,
    teamName: null,
    pdiOverdue: 0,
    cells: cells.map(([equipmentId, adherence]) => ({ equipmentId, adherence, scored: adherence === null ? 0 : 5, applicable: 5, above: 1, exact: 2, below: 2 })),
    ...extra,
  };
}

export function teamFixture(): TeamMatrixDto {
  return {
    qualifiedAdherence: 80,
    equipments: [
      { id: "blister", name: "Blistadeira CAM", minQualified: 2, qualified: 2, qualifiedByShift: {}, status: "ok" },
      { id: "cartucho", name: "Encartuchadeira CAM", minQualified: 2, qualified: 1, qualifiedByShift: {}, status: "single" },
      { id: "caixa", name: "Encaixotadora CAM", minQualified: 1, qualified: 0, qualifiedByShift: {}, status: "none" },
    ],
    members: [
      teamMember("Bia", "second", [["blister", 90], ["cartucho", 72], ["caixa", 60]], { gradeName: "Pleno", teamName: "Mecânica" }),
      teamMember("Ana", "first", [["blister", 85], ["cartucho", 81]], { gradeName: "Sênior", pdiOverdue: 2 }),
      teamMember("Caio", "first", [["blister", 40], ["caixa", 75]], { gradeName: "Júnior", teamName: "Elétrica" }),
      teamMember("Davi", "third", [["cartucho", null]]),
    ],
    lines: [
      { id: "cam05", name: "CAM 05", factoryName: "Fábrica 1", machines: [{ id: "m1", name: "Blistadeira", equipmentId: "blister" }, { id: "m2", name: "Encartuchadeira", equipmentId: "cartucho" }] },
      { id: "cam08", name: "CAM 08", factoryName: "Fábrica 1", machines: [{ id: "m3", name: "Blistadeira CAM", equipmentId: "blister" }] },
    ],
    layout: DEFAULT_TEAM_MATRIX_LAYOUT,
  };
}
