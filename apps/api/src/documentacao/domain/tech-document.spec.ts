import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertDocumentCanBeRemoved, assertDocumentFile, readTechDocumentFields } from "./tech-document";

function rejects(run: () => unknown, statusCode: number, part: string) {
  assert.throws(run, (error: unknown) => error instanceof DomainError && error.statusCode === statusCode && error.message.includes(part));
}

describe("documento técnico", () => {
  it("lê nome, tipo e revisão; tipo em branco vira outro", () => {
    const fields = readTechDocumentFields({ equipmentId: "e1", name: " Catálogo C 2504 ", kind: "parts_catalog", revision: "Version 1" });
    assert.deepEqual(fields, { equipmentId: "e1", name: "Catálogo C 2504", kind: "parts_catalog", revision: "Version 1" });
    assert.equal(readTechDocumentFields({ equipmentId: "e1", name: "x" }).kind, "other");
    rejects(() => readTechDocumentFields({ equipmentId: "e1", name: "x", kind: "video" }), 400, "não existe");
    rejects(() => readTechDocumentFields({ name: "x" }), 400, "equipmentId");
  });

  it("aceita PDF e imagem até 200 MB", () => {
    const pdf = { size: 10, mimetype: "application/pdf", originalname: "a.pdf" };
    assert.equal(assertDocumentFile(pdf), pdf);
    rejects(() => assertDocumentFile(undefined), 400, "Escolha o arquivo");
    rejects(() => assertDocumentFile({ ...pdf, mimetype: "application/zip" }), 400, "não serve");
    rejects(() => assertDocumentFile({ ...pdf, size: 201 * 1024 * 1024 }), 400, "máximo é 200 MB");
  });

  it("não exclui documento que é fonte de ficha", () => {
    assert.doesNotThrow(() => assertDocumentCanBeRemoved(0));
    rejects(() => assertDocumentCanBeRemoved(2), 409, "2 fichas");
  });
});
