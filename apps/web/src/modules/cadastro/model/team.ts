import type { MemberDto, TeamDto } from "@manutencao/shared";
import { memberStatusLabel } from "./labels";

// O supervisor pertence à equipe que lidera; o técnico, à equipe em que está.
export function teamsOf(member: MemberDto, teams: TeamDto[]): TeamDto[] {
  return member.position === "supervisor"
    ? teams.filter((team) => team.supervisorId === member.id)
    : teams.filter((team) => team.id === member.teamId);
}

export function teamText(member: MemberDto, teams: TeamDto[]): string | null {
  const names = teamsOf(member, teams).map((team) => team.name);
  if (!names.length) return null;
  return member.position === "supervisor" ? `lidera ${names.join(", ")}` : names[0];
}

/**
 * Situação do colaborador quando não é "Ativo" (férias, afastado, inativo), para marcar ao lado do nome.
 * @example memberStatusNote(ana) // "Inativo"; para quem está ativo, null
 */
export function memberStatusNote(member: Pick<MemberDto, "status">): string | null {
  return member.status === "active" ? null : memberStatusLabel(member.status);
}

/**
 * Nome do técnico em "Adicionar técnico…": a situação, como no select de supervisor, e a equipe que ele deixa.
 * @example teamCandidateLabel(ana, "Turno A") // "Ana (Inativo, sai de Turno A)"
 */
export function teamCandidateLabel(member: Pick<MemberDto, "name" | "status">, currentTeamName: string | null): string {
  const notes = [memberStatusNote(member), currentTeamName ? `sai de ${currentTeamName}` : null].filter(Boolean);
  return notes.length ? `${member.name} (${notes.join(", ")})` : member.name;
}
