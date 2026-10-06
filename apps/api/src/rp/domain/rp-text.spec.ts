import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { parseRpText } from "./rp-text";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", `${name}.txt`), "utf8");
}

function only(text: string) {
  const reports = parseRpText(text);
  assert.equal(reports.length, 1);
  return reports[0]!;
}

describe("parseRpText com relatórios reais do WhatsApp", () => {
  it("RP1: texto com asteriscos, 4M em branco e técnico com inicial", () => {
    const rp = only(fixture("rp1"));
    assert.equal(rp.date, "2026-10-04");
    assert.equal(rp.line, "Cam 08");
    assert.equal(rp.tag, "EBS-BLI-31");
    assert.equal(rp.orderNumber, null);
    assert.equal(rp.problem, "Alarme de controle de posição de produtos na esteira.");
    assert.equal(rp.description?.split("\n").length, 2);
    assert.equal(rp.repeatedFailure, false);
    assert.equal(rp.repeatedTimes, null);
    assert.deepEqual(Object.values(rp.causes).map((cause) => cause.marked), [false, false, false, false]);
    assert.equal(rp.rootCause, "Parâmetros de entrega do porta ventosas desajustados.");
    assert.equal(rp.corrective?.split("\n").length, 3);
    assert.equal(rp.preventive?.split("\n").length, 2);
    assert.equal(rp.status, "corrected");
    assert.deepEqual(rp.technicians, ["Rogério B"]);
    assert.equal(rp.basicConditionImpact, null);
    assert.deepEqual(rp.warnings, []);
  });

  it("RP2: rótulo com espaço antes de ':', 4M marcado com X, quarta opção de status", () => {
    const rp = only(fixture("rp2"));
    assert.equal(rp.line, "blisterflex ONC");
    assert.equal(rp.tag, "EBS-ONC-02");
    assert.equal(rp.problem, "Deformação de bolhas durante corte da faca.");
    assert.equal(rp.causes.machine.marked, true);
    assert.equal(rp.causes.machine.text, "X (FERRAMENTAL)");
    assert.equal(rp.causes.material.marked, false);
    assert.equal(rp.causes.method.marked, false);
    assert.equal(rp.causes.labor.marked, false);
    assert.equal(rp.rootCause?.split("\n").length, 2);
    assert.equal(rp.corrective?.split("\n").length, 2);
    assert.equal(rp.preventive?.split("\n").length, 2);
    assert.equal(rp.status, "corrected");
    assert.deepEqual(rp.technicians, ["Douglas"]);
  });

  it("RP3: sem asteriscos nos rótulos, '(pergunta)' depois do rótulo, EXECUTANTES e marcador '.'", () => {
    const rp = only(fixture("rp3"));
    assert.equal(rp.date, "2026-10-04");
    assert.equal(rp.line, "cam01");
    assert.equal(rp.tag, "EBS-BLI-20");
    assert.equal(rp.problem, "Esteira do magazine de blister não tracionando.");
    assert.ok(rp.description?.startsWith("Observado que motor"));
    assert.ok(!rp.description?.includes("o que foi observado"));
    assert.equal(rp.repeatedFailure, false);
    assert.equal(rp.causes.material.marked, false);
    assert.equal(rp.causes.machine.marked, false);
    assert.equal(rp.causes.method.marked, false);
    assert.equal(rp.causes.labor.marked, true);
    assert.equal(rp.causes.labor.text, "sim");
    assert.ok(rp.rootCause?.startsWith("motor com baixa tensão"));
    assert.ok(!rp.rootCause?.includes("por que aconteceu"));
    assert.equal(rp.corrective?.split("\n").length, 3);
    assert.ok(!rp.corrective?.includes("o que foi feito agora"));
    assert.ok(rp.preventive?.startsWith("Foi instruído operador"));
    assert.equal(rp.status, "corrected");
    assert.deepEqual(rp.technicians, ["Willian Jonh", "Paulo Paniguel"]);
    assert.equal(rp.basicConditionImpact, null);
  });

  it("separa os três relatórios colados de uma vez", () => {
    const reports = parseRpText([fixture("rp1"), "----", fixture("rp2"), "---", fixture("rp3")].join("\n"));
    assert.equal(reports.length, 3);
    assert.deepEqual(reports.map((rp) => rp.tag), ["EBS-BLI-31", "EBS-ONC-02", "EBS-BLI-20"]);
  });

  it("separa relatórios colados sem linha de traços, pelo título", () => {
    const reports = parseRpText([fixture("rp1"), "", fixture("rp3")].join("\n"));
    assert.equal(reports.length, 2);
  });
});

describe("parseRpText em outras formas", () => {
  it("lê rótulos sem asteriscos, em outra ordem e sem acento", () => {
    const rp = only(
      [
        "STATUS:",
        "(x) Em monitoramento",
        "TECNICO: Ana",
        "PROBLEMA: Motor esquentando",
        "DATA: 5/10/26",
        "LINHA: CAM3",
        "ORDEM: 123 456",
        "CAUSA RAIZ: rolamento seco",
      ].join("\n"),
    );
    assert.equal(rp.date, "2026-10-05");
    assert.equal(rp.status, "monitoring");
    assert.equal(rp.problem, "Motor esquentando");
    assert.equal(rp.line, "CAM3");
    assert.equal(rp.orderNumber, "123 456");
    assert.equal(rp.rootCause, "rolamento seco");
    assert.deepEqual(rp.technicians, ["Ana"]);
  });

  it("lê falha repetida marcada com quantidade e período", () => {
    const rp = only(
      [
        "PROBLEMA: Falha no sensor",
        "FALHA REPETIDA?",
        "( ) Não",
        "(X) Sim → Quantas vezes? 3",
        "Período aproximado: último mês",
      ].join("\n"),
    );
    assert.equal(rp.repeatedFailure, true);
    assert.equal(rp.repeatedTimes, "3");
    assert.equal(rp.repeatedPeriod, "último mês");
  });

  it("aceita a opção de status Produzindo", () => {
    const rp = only(["PROBLEMA: x", "STATUS:", "( ) Em análise", "( ) Corrigido", "(X) Produzindo"].join("\n"));
    assert.equal(rp.status, "producing");
  });

  it("não confunde frase do texto com rótulo", () => {
    const rp = only(
      [
        "PROBLEMA: Motor parou",
        "DESCRIÇÃO DO PROBLEMA:",
        "Problema no motor desde cedo.",
        "Status do equipamento era desconhecido.",
        "Máquina parada por duas horas.",
        "STATUS:",
        "(X) Corrigido",
      ].join("\n"),
    );
    assert.equal(rp.description, "Problema no motor desde cedo.\nStatus do equipamento era desconhecido.\nMáquina parada por duas horas.");
    assert.equal(rp.causes.machine.marked, false);
    assert.equal(rp.status, "corrected");
  });

  it("trata N/A, na e não como 4M vazio e N/A no impacto como nulo", () => {
    const rp = only(
      ["PROBLEMA: x", "4M", "- MATERIAL: N/A", "- MÁQUINA: não", "- MÉTODO: na", "- MÃO DE OBRA: X", "IMPACTO EM CONDIÇÃO BÁSICA?", "N/A"].join("\n"),
    );
    assert.deepEqual(Object.values(rp.causes).map((cause) => cause.marked), [false, false, false, true]);
    assert.equal(rp.basicConditionImpact, null);
  });

  it("junta técnicos separados por vírgula, 'e' e '/'", () => {
    const rp = only("PROBLEMA: x\nTÉCNICOS: Ana, Bruno e Carla / Dani");
    assert.deepEqual(rp.technicians, ["Ana", "Bruno", "Carla", "Dani"]);
  });

  it("avisa de data inválida, status ausente e técnico ausente sem falhar", () => {
    const rp = only("PROBLEMA: x\nDATA: 31/02/2026");
    assert.equal(rp.date, null);
    assert.equal(rp.status, "analysis");
    assert.equal(rp.warnings.length, 3);
  });

  it("lê acentos decompostos (NFD) como os compostos", () => {
    const rp = only("PROBLEMA: x\n4M\nM\u00c1QUINA: X\nMETODO: y".normalize("NFD"));
    assert.equal(rp.causes.machine.marked, true);
    assert.equal(rp.causes.method.text, "y");
  });

  it("recusa texto sem nenhum rótulo", () => {
    assert.throws(() => parseRpText("oi, tudo bem?"), (error) => error instanceof DomainError && error.statusCode === 400);
    assert.throws(() => parseRpText("   "), DomainError);
  });
});
