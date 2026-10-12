import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TechCardFields } from "@manutencao/shared";
import { buildSearchText, isExactHit, normalizeSearchText, rankHits, searchTerms } from "./search-text";

const fields: TechCardFields = {
  type: "interface",
  equipmentId: null,
  machineId: null,
  lineId: "l1",
  subassemblyId: null,
  code: null,
  title: "CP600 → Encartuchadeira P3200",
  summary: "Acopladas (Verbund). A CP600 pede e espera \"Verbund OK\".",
  details: { medium: "Ethernet switch -X1664 porta 7", symptom: "Alarme 127" },
  deviceTag: "-X1664",
  originalTerm: "Folgemaschine",
  tags: ["Rede", "Elétrica"],
  documentId: null,
  page: null,
  sheet: "166",
  reviewNeeded: false,
};

describe("texto da busca", () => {
  it("tira acento, caixa e pontuação, mantendo tag, nº de peça e folha", () => {
    assert.equal(normalizeSearchText("Ciclóide  (817611)"), "cicloide 817611");
    assert.equal(normalizeSearchText("Chave -S2121 em \"Einrichten Solo\""), "chave -s2121 em einrichten solo");
    assert.equal(normalizeSearchText("I5.3 / K0921"), "i5.3 / k0921");
  });

  it("junta tudo que a ficha tem para a busca achar por qualquer pedaço", () => {
    const text = buildSearchText(fields);
    for (const piece of ["cp600", "p3200", "verbund ok", "-x1664", "alarme 127", "folgemaschine", "166", "rede", "eletrica"]) {
      assert.ok(text.includes(piece), piece);
    }
  });

  it("quebra a busca em palavras únicas normalizadas", () => {
    assert.deepEqual(searchTerms(" Verbund  127 verbund "), ["verbund", "127"]);
    assert.deepEqual(searchTerms("   "), []);
  });

  it("acerto exato é a busca inteira igual ao código ou à tag", () => {
    assert.ok(isExactHit({ code: "938580", deviceTag: null }, " 938580 "));
    assert.ok(isExactHit({ code: null, deviceTag: "-X1664" }, "-x1664"));
    assert.ok(!isExactHit({ code: "9385801", deviceTag: null }, "938580"));
    assert.ok(!isExactHit({ code: null, deviceTag: null }, ""));
  });

  it("ordena exato, começo do código, título e depois a mais recente", () => {
    const card = (code: string | null, title: string, updatedAt: string) => ({ code, deviceTag: null, title, updatedAt });
    const ranked = rankHits(
      [
        card("127", "Alarme 127 Verbund", "2026-10-01"),
        card("1270", "Outro", "2026-10-03"),
        card(null, "Fala do 127", "2026-10-02"),
        card(null, "Nada a ver", "2026-10-09"),
        card(null, "Nada a ver mais novo", "2026-10-10"),
      ],
      "127",
    );
    assert.deepEqual(
      ranked.map((item) => item.title),
      ["Alarme 127 Verbund", "Outro", "Fala do 127", "Nada a ver mais novo", "Nada a ver"],
    );
  });
});
