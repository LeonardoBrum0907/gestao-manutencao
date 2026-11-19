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
    assert.equal(rp.causes.machine.text, "FERRAMENTAL");
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
    assert.equal(rp.causes.labor.text, null);
    assert.ok(rp.rootCause?.startsWith("motor com baixa tensão"));
    assert.ok(!rp.rootCause?.includes("por que aconteceu"));
    assert.equal(rp.corrective?.split("\n").length, 3);
    assert.ok(!rp.corrective?.includes("o que foi feito agora"));
    assert.ok(rp.preventive?.startsWith("Foi instruído operador"));
    assert.equal(rp.status, "corrected");
    assert.deepEqual(rp.technicians, ["Willian Jonh", "Paulo Paniguel"]);
    assert.equal(rp.basicConditionImpact, "Não"); // "N/A" no texto
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

// Textos de produção (conferidos em 2026-11-19), encurtados.
describe("parseRpText com os modelos que o time passou a usar", () => {
  it("RP4: modelo do Renan, rótulos em negrito sem dois-pontos", () => {
    const rp = only(fixture("rp4"));
    assert.equal(rp.date, "2026-11-18");
    assert.equal(rp.line, "CAM 6");
    assert.equal(rp.tag, "EBS-ECT-15");
    assert.equal(rp.problem, "Alarme de Fricção Máquina S14.");
    assert.deepEqual(rp.technicians, ["Pedro", "Renan"]);
    assert.ok(!rp.warnings.some((warning) => warning.startsWith("Data")));
  });

  it("RP5: ORDEM DE SERVIÇO abaixo da TAG, sem engolir a linha", () => {
    const rp = only(fixture("rp5"));
    assert.equal(rp.tag, "EBS-ECT-19");
    assert.equal(rp.orderNumber, "7730936");
    assert.equal(rp.line, "Mediseal #02");
  });

  it("RP6: pergunta do modelo na linha de baixo do rótulo fica fora do texto", () => {
    const rp = only(fixture("rp6"));
    assert.equal(rp.problem, "Falha leitor de dados variáveis.");
    assert.ok(rp.description?.startsWith("Máquina apresentando"));
    assert.equal(rp.rootCause, "Surto eletrônico na comunicação.");
    assert.equal(rp.corrective, "Verificado os cabos de rede.");
    assert.equal(rp.preventive, "Entrar em contato com fabricante.");
  });

  it("RP7: pergunta sem '?' ainda separa a descrição do problema", () => {
    const rp = only(fixture("rp7"));
    assert.equal(rp.problem, "Máquina inoperante / não liga.");
    assert.equal(rp.description, "IHM travada e desligando-se sozinha de forma intermitente.");
  });

  it("separa dois relatórios com título 'RELATÓRIO MANUTENÇÃO' ou 'O *RELATÓRIO PADRÃO'", () => {
    const reports = parseRpText([fixture("rp4"), "", fixture("rp5"), "", fixture("rp6")].join("\n"));
    assert.deepEqual(reports.map((rp) => rp.tag), ["EBS-ECT-15", "EBS-ECT-19", "EBS-BLI-33"]);
  });

  it("separa dois relatórios sem título nem traços pela segunda DATA", () => {
    const reports = parseRpText(["DATA: 01/11/2026", "PROBLEMA: a", "TÉCNICO: Ana", "DATA: 02/11/2026", "PROBLEMA: b"].join("\n"));
    assert.deepEqual(reports.map((rp) => [rp.date, rp.problem]), [["2026-11-01", "a"], ["2026-11-02", "b"]]);
  });
});

describe("parseRpText em outras formas", () => {
  it("lê rótulo com traço e outros nomes para ordem e técnicos", () => {
    const rp = only(["LINHA - MED 06", "OS: 123", "PROBLEMA: x", "TÉCNICOS RESPONSÁVEIS: Ana"].join("\n"));
    assert.equal(rp.line, "MED 06");
    assert.equal(rp.orderNumber, "123");
    assert.deepEqual(rp.technicians, ["Ana"]);
    for (const label of ["Responsável:", "Executado por:", "Técnico(s):", "Manutentores:"]) {
      assert.deepEqual(only(`PROBLEMA: x\n${label} Bruno`).technicians, ["Bruno"], label);
    }
    for (const label of ["O.S.:", "Nº OS:", "ORDEM DE SERVIÇO:"]) {
      assert.equal(only(`PROBLEMA: x\n${label} 456`).orderNumber, "456", label);
    }
  });

  it("trata ordem n/a como vazia e avisa da data sem ano", () => {
    const rp = parseRpText("PROBLEMA: x\nORDEM: n/a\nDATA: 18/11", "2026-11-19")[0]!;
    assert.equal(rp.orderNumber, null);
    assert.equal(rp.date, "2026-11-18");
    assert.ok(rp.warnings.includes("Data sem ano: usei 2026. Confira a data."));
  });

  it("não lê frase em negrito no meio do texto como rótulo de campo longo", () => {
    const rp = only(["PROBLEMA: x", "CONTRAMEDIDA CORRETIVA:", "*Problema* resolvido trocando o sensor."].join("\n"));
    assert.equal(rp.problem, "x");
    assert.ok(rp.corrective?.includes("resolvido trocando o sensor"));
  });

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

  it("trata N/A, na e não como 4M vazio e N/A no impacto como Não", () => {
    const rp = only(
      ["PROBLEMA: x", "4M", "- MATERIAL: N/A", "- MÁQUINA: não", "- MÉTODO: na", "- MÃO DE OBRA: X", "IMPACTO EM CONDIÇÃO BÁSICA?", "N/A"].join("\n"),
    );
    assert.deepEqual(Object.values(rp.causes).map((cause) => cause.marked), [false, false, false, true]);
    // Sim/Não desde 2026-10-31: N/A no impacto é "sem impacto".
    assert.equal(rp.basicConditionImpact, "Não");
  });

  it("lê o quadrinho marcado do impacto em condição básica como Sim ou Não", () => {
    const text = (answer: string) => ["PROBLEMA: x", "IMPACTO EM CONDIÇÃO BÁSICA? (Necessidade de qualificação?):*.", answer].join("\n");
    assert.equal(only(text("(  ) Sim.  ( X ) Não.")).basicConditionImpact, "Não");
    assert.equal(only(text("( X ) Sim.  (  ) Não.")).basicConditionImpact, "Sim");
    assert.equal(only(text("não")).basicConditionImpact, "Não");
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

describe("parseRpText: 4M e status como o time marca", () => {
  it("lê rótulo com espaço a mais, sem jogar a MÃO DE  OBRA no MÉTODO (MED 04, 2026-10-31)", () => {
    const rp = only(fixture("rp8"));
    assert.deepEqual(rp.causes.method, { marked: false, text: null });
    assert.deepEqual(rp.causes.labor, { marked: false, text: null });
    assert.equal(rp.causes.machine.marked, true);
  });

  it("\"Não se aplica.\" no 4M deixa a causa sem marcar (MEDISEAL 02)", () => {
    const rp = only(fixture("rp5"));
    assert.deepEqual(rp.causes.material, { marked: false, text: null });
    assert.deepEqual(rp.causes.method, { marked: false, text: null });
    assert.equal(rp.causes.machine.text, "Rompimento do eixo motriz.");
    assert.equal(rp.causes.labor.marked, true);
  });

  it("vezes e período com N/A, \"Não se aplica\" ou traços ficam vazios", () => {
    assert.deepEqual([only(fixture("rp4")).repeatedTimes, only(fixture("rp4")).repeatedPeriod], [null, null]);
    assert.deepEqual([only(fixture("rp6")).repeatedTimes, only(fixture("rp6")).repeatedPeriod], ["3", null]);
  });

  it("lê o 4M com quadrinho na frente do rótulo (modelo do Renan)", () => {
    const rp = only(fixture("rp4"));
    assert.deepEqual(rp.causes.machine, { marked: true, text: null });
    assert.deepEqual(rp.causes.material, { marked: false, text: null });
    assert.deepEqual(rp.causes.labor, { marked: false, text: null });
  });

  it("detalhe embaixo do quadrinho marcado vira o texto da causa", () => {
    const rp = only("PROBLEMA: x\n4M\n( ) *MATERIAL*\n(✅) *MÁQUINA*\n- Rolamento travado.\n() *MÉTODO*");
    assert.deepEqual(rp.causes.machine, { marked: true, text: "Rolamento travado." });
    assert.equal(rp.causes.method.marked, false);
    assert.equal(rp.causes.material.marked, false);
  });

  it("status marcado com ✅ vale como o X (MEDISEAL 02)", () => {
    const rp = only(fixture("rp5"));
    assert.equal(rp.status, "corrected");
    assert.ok(!rp.warnings.some((warning) => warning.startsWith("Status")));
  });

  it("lê o status Parado (aguardando qualificação) e avisa quando há mais de um marcado", () => {
    const rp = only(fixture("rp4"));
    assert.equal(rp.status, "stopped");
    assert.ok(rp.warnings.includes("Status com 2 opções marcadas: usei a primeira. Confira o status."));
  });

  it("três status com ✅ ficam no primeiro, com aviso (CAM 05, 2026-11-17)", () => {
    const rp = only(fixture("rp9"));
    assert.equal(rp.status, "analysis");
    assert.ok(rp.warnings.includes("Status com 3 opções marcadas: usei a primeira. Confira o status."));
  });

  it("falha repetida marcada com ✅ no Sim", () => {
    const rp = only("PROBLEMA: x\nFALHA REPETIDA?\n( ) Não\n(✅) Sim → Quantas vezes? 2");
    assert.deepEqual([rp.repeatedFailure, rp.repeatedTimes], [true, "2"]);
  });

  it("separa técnicos por traço e tira cargo, \"Téc.\" e ponto do fim", () => {
    assert.deepEqual(only("PROBLEMA: x\nTÉCNICOS: Pedro - Renan – Ana").technicians, ["Pedro", "Renan", "Ana"]);
    assert.deepEqual(only("PROBLEMA: x\nTÉCNICOS: Renan (eletricista), Téc. Bruno, Diego., Israel Vieira*").technicians, ["Renan", "Bruno", "Diego", "Israel Vieira"]);
    assert.deepEqual(only("PROBLEMA: x\nTÉCNICOS: Lucas.J / Ana-Maria").technicians, ["Lucas.J", "Ana-Maria"]);
  });
});
