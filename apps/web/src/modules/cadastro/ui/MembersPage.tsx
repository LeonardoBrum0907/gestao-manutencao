import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MemberDto, MemberPosition } from "@manutencao/shared";
import { Button, Card, Field, PageTitle, SelectInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { useMembers, useTeams } from "../data/cadastro";
import { teamsOf } from "../model/team";
import { MemberPanel } from "./MemberPanel";
import { memberColumns, memberStacked } from "./member-table";

const NO_TEAM = "none";

// undefined: fechado; null: novo; colaborador: aberto (e, se pedido, já na pergunta de exclusão).
type Open = { member: MemberDto | null; removing?: boolean } | undefined;

export function MembersPage() {
  const members = useMembers();
  const teams = useTeams();
  const [positionFilter, setPositionFilter] = useState<MemberPosition | "">("");
  const [teamFilter, setTeamFilter] = useState("");
  const [open, setOpen] = useState<Open>(undefined);
  const navigate = useNavigate();

  const allTeams = teams.data ?? [];
  const visible = members.data?.filter((member) => {
    if (positionFilter && member.position !== positionFilter) return false;
    if (!teamFilter) return true;
    const own = teamsOf(member, allTeams);
    return teamFilter === NO_TEAM ? own.length === 0 : own.some((team) => team.id === teamFilter);
  });

  return (
    <div>
      <PageTitle
        eyebrow="Equipe"
        title="Colaboradores"
        text="Clique numa pessoa para abrir a ficha completa (matriz, PDI e desempenho) e no título de uma coluna para ordenar. O cadastro se edita pelo botão Editar da ficha ou pelo menu ⋯."
        action={<Button onClick={() => setOpen({ member: null })}>Novo colaborador</Button>}
      />
      {members.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {members.data?.length ? (
        <div className="mb-4 grid gap-3 sm:max-w-xl sm:grid-cols-2">
          <Field label="Cargo">
            <SelectInput value={positionFilter} onChange={(event) => setPositionFilter(event.target.value as MemberPosition | "")}>
              <option value="">Todos</option>
              <option value="technician">Técnicos</option>
              <option value="supervisor">Supervisores</option>
            </SelectInput>
          </Field>
          <Field label="Equipe">
            <SelectInput value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
              <option value="">Todas</option>
              <option value={NO_TEAM}>Sem equipe</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      ) : null}
      {members.data?.length === 0 ? <Card>Nenhum colaborador ainda.</Card> : null}
      {members.data?.length && visible?.length === 0 ? <Card>Ninguém com esse filtro.</Card> : null}
      {visible?.length ? (
        <DataTable
          label="Colaboradores"
          rows={visible}
          rowKey={(member) => member.id}
          columns={memberColumns(allTeams)}
          stacked={(member) => memberStacked(member, allTeams)}
          defaultSort={{ key: "name", direction: "asc" }}
          countLabel={(count) => (count === 1 ? "1 pessoa" : `${count} pessoas`)}
          selectedKey={open?.member?.id}
          onOpen={(member) => navigate(`/cadastro/colaboradores/${member.id}`)}
          menu={(member) => ({
            label: `Mais ações de ${member.name}`,
            items: [
              { label: "Editar", onSelect: () => setOpen({ member }) },
              { label: "Excluir…", danger: true, onSelect: () => setOpen({ member, removing: true }) },
            ],
          })}
        />
      ) : null}
      {open ? (
        <MemberPanel
          key={`${open.member?.id ?? "novo"}-${open.removing ? "excluir" : "editar"}`}
          member={open.member}
          startRemoving={open.removing}
          onClose={() => setOpen(undefined)}
        />
      ) : null}
    </div>
  );
}
