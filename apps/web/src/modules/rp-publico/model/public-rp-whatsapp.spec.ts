import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { samplePublicRp, sampleDirectory } from "./fake-public-rp";
import { publicRpWhatsappText } from "./public-rp-whatsapp";

describe("publicRpWhatsappText", () => {
  it("usa o nome da linha do cadastro e os nomes dos técnicos", () => {
    const text = publicRpWhatsappText(samplePublicRp(), sampleDirectory.lines);
    assert.match(text, /\*LINHA:\* Cam 08\n/);
    assert.match(text, /\*TÉCNICO:\* Rogério B\n/);
  });

  it("sem linha do cadastro, usa a linha escrita à mão", () => {
    assert.match(publicRpWhatsappText(samplePublicRp({ lineId: null, line: "Linha nova" }), sampleDirectory.lines), /\*LINHA:\* Linha nova\n/);
  });
});
