import { Injectable } from "@nestjs/common";
import type { TeamMatrixDto } from "@manutencao/shared";
import { buildTeamMatrix } from "../domain/team";
import { CatalogRepository } from "../infra/catalog.repository";
import { MatrixRepository } from "../infra/matrix.repository";

@Injectable()
export class TeamMatrix {
  constructor(
    private readonly matrix: MatrixRepository,
    private readonly catalog: CatalogRepository,
  ) {}

  async show(): Promise<TeamMatrixDto> {
    const [catalog, members] = await Promise.all([this.catalog.load(), this.matrix.loadTeam()]);
    return buildTeamMatrix(catalog, members);
  }
}
