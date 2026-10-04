import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DomainError } from "../../kernel/domain-error";
import { assertCanJoinTeam, assertMemberShape, assertPositionChange, requirePosition } from "./member-position";

function fails(run: () => void, code: string, statusCode: number) {
  assert.throws(run, (error: unknown) => {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}

describe("cargo do colaborador", () => {
  it("aceita técnico e supervisor e recusa o resto", () => {
    assert.equal(requirePosition("technician"), "technician");
    assert.equal(requirePosition("supervisor"), "supervisor");
    fails(() => requirePosition("coordenador"), "invalid", 400);
  });

  it("exige função do técnico e deixa o supervisor sem", () => {
    fails(() => assertMemberShape({ position: "technician", roleId: null, teamId: null }), "invalid", 400);
    assert.doesNotThrow(() => assertMemberShape({ position: "technician", roleId: "role", teamId: "team" }));
    assert.doesNotThrow(() => assertMemberShape({ position: "supervisor", roleId: null, teamId: null }));
  });

  it("não deixa supervisor entrar como membro de equipe", () => {
    fails(() => assertMemberShape({ position: "supervisor", roleId: null, teamId: "team" }), "supervisor_not_member", 400);
    fails(() => assertCanJoinTeam("supervisor"), "supervisor_not_member", 400);
    assert.doesNotThrow(() => assertCanJoinTeam("technician"));
  });

  it("recusa tirar o cargo de quem ainda lidera equipe", () => {
    fails(() => assertPositionChange("supervisor", "technician", 1), "supervisor_leads_team", 409);
    assert.doesNotThrow(() => assertPositionChange("supervisor", "technician", 0));
    assert.doesNotThrow(() => assertPositionChange("supervisor", "supervisor", 2));
    assert.doesNotThrow(() => assertPositionChange("technician", "supervisor", 0));
  });
});
