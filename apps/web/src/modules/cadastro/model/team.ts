import type { MemberDto, TeamDto } from "@manutencao/shared";

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
