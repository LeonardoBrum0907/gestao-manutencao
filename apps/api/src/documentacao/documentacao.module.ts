import { Module } from "@nestjs/common";
import { RegistroModule } from "../registro/registro.module";
import { TechCards } from "./application/tech-cards";
import { TechDocuments } from "./application/tech-documents";
import { TechCardsController } from "./http/tech-cards.controller";
import { TechDocumentsController } from "./http/tech-documents.controller";
import { TechCardRepository } from "./infra/tech-card.repository";
import { TechDocumentRepository } from "./infra/tech-document.repository";

// Documentação técnica por máquina: PDFs guardados no servidor e fichas de conhecimento com busca.
@Module({
  imports: [RegistroModule],
  controllers: [TechDocumentsController, TechCardsController],
  providers: [TechDocumentRepository, TechCardRepository, TechDocuments, TechCards],
})
export class DocumentacaoModule {}
