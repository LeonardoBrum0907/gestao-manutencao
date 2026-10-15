import type { MemberDto, TeamDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../model/labels";
import { memberStatusNote, teamText } from "../model/team";

// "Ativo" é o normal: só a exceção (férias, afastado, inativo) ganha cor.
function StatusText({ member }: { member: MemberDto }) {
  return <span className={memberStatusClass(member.status) || "text-muted"}>{memberStatusLabel(member.status)}</span>;
}

/**
 * Colunas da lista de colaboradores; a equipe depende do cadastro de equipes.
 * @example <DataTable columns={memberColumns(teams)} ... />
 */
export function memberColumns(teams: TeamDto[]): TableColumn<MemberDto>[] {
  return [
    { key: "name", header: "Nome", cell: (member) => member.name, sortValue: (member) => member.name },
    { key: "position", header: "Cargo", cell: (member) => positionLabel(member.position), sortValue: (member) => positionLabel(member.position) },
    { key: "role", header: "Função", cell: (member) => member.roleName ?? "—", sortValue: (member) => member.roleName },
    { key: "grade", header: "Grau", cell: (member) => member.gradeName ?? "—", sortValue: (member) => member.gradeName },
    { key: "shift", header: "Turno", cell: (member) => shiftLabel(member.shift), sortValue: (member) => shiftLabel(member.shift) },
    { key: "team", header: "Equipe", cell: (member) => teamText(member, teams) ?? "Sem equipe", sortValue: (member) => teamText(member, teams) },
    { key: "status", header: "Situação", cell: (member) => <StatusText member={member} />, sortValue: (member) => memberStatusLabel(member.status) },
  ];
}

/**
 * A linha do colaborador no celular: nome, cargo e lugar; a situação só aparece quando não é "Ativo".
 * @example stacked={(member) => memberStacked(member, teams)}
 */
export function memberStacked(member: MemberDto, teams: TeamDto[]): StackedRow {
  const meta = [positionLabel(member.position), member.roleName, member.gradeName, teamText(member, teams) ?? shiftLabel(member.shift)];
  return {
    title: member.name,
    meta: meta.filter(Boolean).join(" · "),
    side: member.status === "active" ? null : <StatusText member={member} />,
  };
}

// Na equipe, a situação vai entre parênteses ao lado do nome, como a do supervisor no topo do cartão.
function TeamMemberName({ member }: { member: MemberDto }) {
  const note = memberStatusNote(member);
  if (!note) return <>{member.name}</>;
  return (
    <>
      {member.name}
      <span className={memberStatusClass(member.status)}> ({note})</span>
    </>
  );
}

/**
 * Técnicos dentro do cartão da equipe: nome, função e turno; tirar da equipe fica no menu ⋯.
 * @example <DataTable plain columns={TEAM_MEMBER_COLUMNS} stacked={teamMemberStacked} ... />
 */
export const TEAM_MEMBER_COLUMNS: TableColumn<MemberDto>[] = [
  { key: "name", header: "Técnico", cell: (member) => <TeamMemberName member={member} />, sortValue: (member) => member.name },
  { key: "role", header: "Função", cell: (member) => member.roleName ?? "—", sortValue: (member) => member.roleName },
  { key: "shift", header: "Turno", cell: (member) => shiftLabel(member.shift), sortValue: (member) => shiftLabel(member.shift) },
];

/**
 * O técnico da equipe no celular: nome (e a situação, se não é "Ativo") em cima, função e turno embaixo.
 * @example stacked={teamMemberStacked}
 */
export function teamMemberStacked(member: MemberDto): StackedRow {
  return { title: <TeamMemberName member={member} />, meta: [member.roleName, shiftLabel(member.shift)].filter(Boolean).join(" · ") };
}
