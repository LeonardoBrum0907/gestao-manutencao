import type { MemberDto, TeamDto } from "@manutencao/shared";
import type { StackedRow, TableColumn } from "../../../design/ui/data-table";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../model/labels";
import { teamText } from "../model/team";

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
