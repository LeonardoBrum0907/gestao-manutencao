import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { MatrixCatalog } from "./application/matrix-catalog";
import { MemberMatrix } from "./application/member-matrix";
import { MatrixCatalogController } from "./http/matrix-catalog.controller";
import { MatrixController } from "./http/matrix.controller";
import { CatalogRepository } from "./infra/catalog.repository";
import { MatrixRepository } from "./infra/matrix.repository";

@Module({
  imports: [CadastroModule],
  controllers: [MatrixController, MatrixCatalogController],
  providers: [MatrixRepository, MemberMatrix, CatalogRepository, MatrixCatalog],
})
export class CompetenciaModule {}
