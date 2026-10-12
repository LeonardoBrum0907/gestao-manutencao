import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { MatrixCatalog } from "./application/matrix-catalog";
import { MatrixSettings } from "./application/matrix-settings";
import { MemberMatrix } from "./application/member-matrix";
import { TeamMatrix } from "./application/team-matrix";
import { MatrixCatalogController } from "./http/matrix-catalog.controller";
import { MatrixController } from "./http/matrix.controller";
import { MatrixSettingsController } from "./http/matrix-settings.controller";
import { TeamMatrixController } from "./http/team-matrix.controller";
import { CatalogRepository } from "./infra/catalog.repository";
import { MatrixRepository } from "./infra/matrix.repository";
import { SettingsRepository } from "./infra/settings.repository";
import { TeamLayoutRepository } from "./infra/team-layout.repository";
import { TeamLinesRepository } from "./infra/team-lines.repository";

@Module({
  imports: [CadastroModule],
  controllers: [MatrixController, MatrixCatalogController, TeamMatrixController, MatrixSettingsController],
  providers: [MatrixRepository, MemberMatrix, CatalogRepository, MatrixCatalog, TeamMatrix, SettingsRepository, MatrixSettings, TeamLinesRepository, TeamLayoutRepository],
  // O catálogo em memória é um só: o repasse lê o mesmo cache que a matriz limpa ao editar.
  exports: [CatalogRepository],
})
export class CompetenciaModule {}
