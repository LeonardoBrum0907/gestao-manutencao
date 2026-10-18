import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";

/**
 * A marca "lidera equipe" vinda de { leadsTeams }.
 * @example requireLeadsTeams({ leadsTeams: true }) // true
 */
export function requireLeadsTeams(body: unknown): boolean {
  const value = readObject(body).leadsTeams;
  if (typeof value !== "boolean") {
    throw new DomainError("invalid", 400, `Lidera equipe inválido: ${JSON.stringify(value)}. Use true ou false.`);
  }
  return value;
}

export type RoleTeamUse = { leadingTeams: number; inTeams: number };

/**
 * Ligar ou desligar a marca muda o cargo de todos com a função, então as regras do cargo valem para todos de uma vez:
 * quem passa a supervisor não pode estar dentro de equipe, e quem lidera equipe não pode deixar de ser supervisor.
 * @example assertLeadsTeamsChange(false, true, { leadingTeams: 0, inTeams: 3 }) // erro 409 supervisor_not_member
 */
export function assertLeadsTeamsChange(current: boolean, next: boolean, use: RoleTeamUse): void {
  if (!current && next && use.inTeams > 0) {
    throw new DomainError(
      "supervisor_not_member",
      409,
      `${use.inTeams} colaborador(es) com esta função estão dentro de uma equipe. Supervisor lidera a equipe, não entra nela: tire-os da equipe antes.`,
    );
  }
  if (current && !next && use.leadingTeams > 0) {
    throw new DomainError(
      "supervisor_leads_team",
      409,
      `Colaboradores com esta função lideram ${use.leadingTeams} equipe(s). Troque o supervisor dessas equipes antes.`,
    );
  }
}
