import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { TechnicianMatrix } from "./application/technician-matrix";
import { MatrixController } from "./http/matrix.controller";
import { MatrixRepository } from "./infra/matrix.repository";

@Module({
  imports: [CadastroModule],
  controllers: [MatrixController],
  providers: [MatrixRepository, TechnicianMatrix],
})
export class CompetenciaModule {}
