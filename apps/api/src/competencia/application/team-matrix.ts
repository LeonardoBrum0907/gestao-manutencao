import { Injectable } from "@nestjs/common";
import type { TeamMatrixDto, TeamMatrixLayoutDto } from "@manutencao/shared";
import { buildTeamMatrix } from "../domain/team";
import { parseTeamLayout, teamLines } from "../domain/team-layout";
import { CatalogRepository } from "../infra/catalog.repository";
import { MatrixRepository } from "../infra/matrix.repository";
import { SettingsRepository } from "../infra/settings.repository";
import { TeamLayoutRepository } from "../infra/team-layout.repository";
import { TeamLinesRepository } from "../infra/team-lines.repository";

@Injectable()
export class TeamMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    private readonly catalog: CatalogRepository,
    private readonly settings: SettingsRepository,
    private readonly lines: TeamLinesRepository,
    private readonly layout: TeamLayoutRepository,
  ) {}

  async show(): Promise<TeamMatrixDto> {
    const [catalog, members, settings, lines, layout] = await Promise.all([
      this.catalog.load(),
      this.matrix.loadTeam(),
      this.settings.load(),
      this.lines.load(),
      this.layout.load(),
    ]);
    const coverage = buildTeamMatrix(catalog, members, settings.qualifiedAdherence);
    const activeEquipmentIds = coverage.equipments.map((equipment) => equipment.id);
    return { ...coverage, lines: teamLines(lines, activeEquipmentIds), layout };
  }

  // A tela manda a disposição inteira a cada mudança (visão, agrupamento ou coluna arrastada).
  saveLayout(body: unknown): Promise<TeamMatrixLayoutDto> {
    return this.layout.save(parseTeamLayout(body));
  }
}
