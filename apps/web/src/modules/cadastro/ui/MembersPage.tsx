import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MemberDto, MemberPosition } from "@manutencao/shared";
import { Button, Card, Field, PageTitle, SelectInput } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { RowMenu } from "../../../design/ui/row-menu";
import { useMembers, useTeams } from "../data/cadastro";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../model/labels";
import { teamsOf, teamText } from "../model/team";
import { MemberPanel } from "./MemberPanel";

const NO_TEAM = "none";

// undefined: fechado; null: novo; colaborador: aberto (e, se pedido, já na pergunta de exclusão).
type Open = { member: MemberDto | null; removing?: boolean } | undefined;

export function MembersPage() {
  const navigate = useNavigate();
  const members = useMembers();
  const teams = useTeams();
  const [positionFilter, setPositionFilter] = useState<MemberPosition | "">("");
  const [teamFilter, setTeamFilter] = useState("");
  const [open, setOpen] = useState<Open>(undefined);

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
        text="Clique numa pessoa para ver e editar o cadastro. Matriz, PDI e desempenho ficam na ficha completa."
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
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card shadow-card">
          {visible.map((member) => (
            <li key={member.id} className={`flex items-center gap-1 pr-2 ${open?.member?.id === member.id ? "bg-accent-soft" : ""}`}>
              <button
                type="button"
                onClick={() => setOpen({ member })}
                className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3 text-left transition hover:bg-accent-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-app">{member.name}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {[positionLabel(member.position), member.roleName, member.gradeName, shiftLabel(member.shift)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="hidden w-40 shrink-0 truncate text-sm text-app md:block">{teamText(member, allTeams) || "Sem equipe"}</span>
                <span className={`w-20 shrink-0 text-sm ${memberStatusClass(member.status) || "text-app"}`}>{memberStatusLabel(member.status)}</span>
                <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted" />
              </button>
              <RowMenu
                label={`Mais ações de ${member.name}`}
                items={[
                  { label: "Abrir ficha completa", onSelect: () => navigate(`/cadastro/colaboradores/${member.id}`) },
                  { label: "Editar", onSelect: () => setOpen({ member }) },
                  { label: "Excluir…", danger: true, onSelect: () => setOpen({ member, removing: true }) },
                ]}
              />
            </li>
          ))}
        </ul>
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
