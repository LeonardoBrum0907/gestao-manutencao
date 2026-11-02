import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MemberDto, RpSupervisorLinkDto } from "@manutencao/shared";
import { supervisorChoices } from "./supervisor-links";

function member(id: string, name: string, extra: Partial<MemberDto> = {}): MemberDto {
  return {
    id, name, position: "supervisor", teamId: null, teamName: null, roleId: null, roleName: null, gradeId: null, gradeName: null,
    shift: "first", area: null, status: "active", registration: null, contact: null, notes: null, publicRp: false, ...extra,
  };
}

const link = (memberId: string): RpSupervisorLinkDto => ({ id: `l-${memberId}`, memberId, name: "", code: "", createdAt: "", stillSupervisor: true });

describe("supervisorChoices", () => {
  it("só supervisores ativos sem link, em ordem de nome", () => {
    const members = [
      member("s2", "Luiz"),
      member("t1", "Bruno", { position: "technician" }),
      member("s1", "Anderson"),
      member("s3", "Marciel", { status: "inactive" }),
      member("s4", "Salatiel", { status: "vacation" }),
      member("s5", "Anésio"),
    ];
    const names = supervisorChoices(members, [link("s5")]).map((item) => item.name);
    assert.deepEqual(names, ["Anderson", "Luiz", "Salatiel"]);
  });
});
