import { Module } from "@nestjs/common";
import { CadastroModule } from "../cadastro/cadastro.module";
import { MemberMatrix } from "./application/member-matrix";
import { MatrixController } from "./http/matrix.controller";
import { MatrixRepository } from "./infra/matrix.repository";

@Module({
  imports: [CadastroModule],
  controllers: [MatrixController],
  providers: [MatrixRepository, MemberMatrix],
})
export class CompetenciaModule {}
