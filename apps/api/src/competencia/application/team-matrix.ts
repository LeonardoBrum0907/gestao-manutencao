import { Injectable } from "@nestjs/common";
import type { TeamMatrixDto } from "@manutencao/shared";
import { buildTeamMatrix } from "../domain/team";
import { CatalogRepository } from "../infra/catalog.repository";
import { MatrixRepository } from "../infra/matrix.repository";
import { SettingsRepository } from "../infra/settings.repository";

@Injectable()
export class TeamMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    private readonly catalog: CatalogRepository,
    private readonly settings: SettingsRepository,
  ) {}

  async show(): Promise<TeamMatrixDto> {
    const [catalog, members, settings] = await Promise.all([this.catalog.load(), this.matrix.loadTeam(), this.settings.load()]);
    return buildTeamMatrix(catalog, members, settings.qualifiedAdherence);
  }
}
