import { Module } from "@nestjs/common";
import { CompetenciaModule } from "../competencia/competencia.module";
import { CatalogRepository } from "../competencia/infra/catalog.repository";
import { TransferBoard } from "./application/transfer-board";
import { TransferPlanner } from "./application/transfer-planner";
import { TRANSFER_CATALOG, TRANSFER_STORE } from "./application/transfer-store";
import { TransfersController } from "./http/transfers.controller";
import { TransferRepository } from "./infra/transfer.repository";

// Repasse entre técnicos: quem ensina, quem aprende e quanto da matriz de um já passou para o outro.
@Module({
  imports: [CompetenciaModule],
  controllers: [TransfersController],
  providers: [
    TransferBoard,
    TransferPlanner,
    { provide: TRANSFER_STORE, useClass: TransferRepository },
    { provide: TRANSFER_CATALOG, useExisting: CatalogRepository },
  ],
})
export class RepasseModule {}
