import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { holdsSupervisorLink } from "./supervisor-holder";

describe("quem segura o link de supervisor", () => {
  it("supervisor ativo, de férias ou afastado segura", () => {
    assert.equal(holdsSupervisorLink({ status: "active", position: "supervisor" }), true);
    assert.equal(holdsSupervisorLink({ status: "vacation", position: "supervisor" }), true);
    assert.equal(holdsSupervisorLink({ status: "away", position: "supervisor" }), true);
  });

  it("desligado, sem função que lidera equipe ou excluído não segura", () => {
    assert.equal(holdsSupervisorLink({ status: "inactive", position: "supervisor" }), false);
    assert.equal(holdsSupervisorLink({ status: "active", position: "technician" }), false);
    assert.equal(holdsSupervisorLink(null), false);
  });
});
