import { isTechDocumentKind, TECH_DOCUMENT_KINDS, TECH_DOCUMENT_MAX_BYTES, type TechDocumentFields } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { optionalString, requiredString } from "../../kernel/parse";

// O que abre numa guia do navegador: PDF e imagem. Outros formatos baixariam, e aí não servem de fonte.
const ACCEPTED_MIME = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;

export type UploadedDocument = { size: number; mimetype: string; originalname: string };

/**
 * Nome, tipo e revisão do documento (campos de texto do formulário multipart ou do MCP).
 * @example readTechDocumentFields({ equipmentId: "e1", name: "Catálogo C 2504", kind: "parts_catalog" })
 */
export function readTechDocumentFields(source: Record<string, unknown>): TechDocumentFields {
  const kind = optionalString(source, "kind") ?? "other";
  if (!isTechDocumentKind(kind)) {
    throw new DomainError("invalid", 400, `Tipo de documento "${kind}" não existe. Use um de: ${TECH_DOCUMENT_KINDS.join(", ")}.`);
  }
  return {
    equipmentId: requiredString(source, "equipmentId", "Escolha o modelo de equipamento (equipmentId)."),
    name: requiredString(source, "name", "Informe o nome do documento."),
    kind,
    revision: optionalString(source, "revision"),
  };
}

/**
 * O arquivo precisa existir, ser PDF ou imagem e caber no limite de documentos (200 MB).
 * @example assertDocumentFile({ size: 1024, mimetype: "application/pdf", originalname: "manual.pdf" })
 */
export function assertDocumentFile(file: UploadedDocument | undefined): UploadedDocument {
  if (!file || !file.size) throw new DomainError("file", 400, "Escolha o arquivo PDF do documento.");
  if (!(ACCEPTED_MIME as readonly string[]).includes(file.mimetype)) {
    throw new DomainError("file", 400, `Arquivo ${file.mimetype} não serve: envie PDF ou imagem (PNG, JPEG, WEBP).`);
  }
  if (file.size > TECH_DOCUMENT_MAX_BYTES) {
    const mb = Math.round(file.size / (1024 * 1024));
    throw new DomainError("file", 400, `Arquivo com ${mb} MB; o máximo é ${TECH_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB.`);
  }
  return file;
}

/**
 * Documento com fichas apontando para ele não sai: as fichas perderiam a fonte.
 * @example assertDocumentCanBeRemoved(0)
 */
export function assertDocumentCanBeRemoved(cardCount: number): void {
  if (cardCount > 0) {
    throw new DomainError("document_in_use", 409, `Este documento é a fonte de ${cardCount} ${cardCount === 1 ? "ficha" : "fichas"}. Troque a fonte das fichas antes de excluir.`);
  }
}
