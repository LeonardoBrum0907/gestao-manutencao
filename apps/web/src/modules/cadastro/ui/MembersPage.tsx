import { useState } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, MemberPosition } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { useDeleteMember, useMembers, useTeams } from "../data/cadastro";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../model/labels";
import { teamsOf, teamText } from "../model/team";
import { MemberFormModal } from "./MemberFormModal";

const NO_TEAM = "none";

export function MembersPage() {
  const members = useMembers();
  const remove = useDeleteMember();
  const teams = useTeams();
  const [positionFilter, setPositionFilter] = useState<MemberPosition | "">("");
  const [teamFilter, setTeamFilter] = useState("");
  // undefined: fechado; null: novo; colaborador: editando.
  const [editing, setEditing] = useState<MemberDto | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

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
        text="Etiqueta do gestor. Sem login."
        action={<Button onClick={() => setEditing(null)}>Novo colaborador</Button>}
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
      <div className="flex flex-col gap-2">
        {members.data?.length === 0 ? <Card>Nenhum colaborador ainda.</Card> : null}
        {members.data?.length && visible?.length === 0 ? <Card>Ninguém com esse filtro.</Card> : null}
        {visible?.map((member) => (
          <Card key={member.id} compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link to={`/cadastro/colaboradores/${member.id}`} className="min-w-0">
              <p className="font-medium text-app transition hover:text-accent hover:underline">{member.name}</p>
              <p className="mt-1 text-sm text-muted">
                {[positionLabel(member.position), member.roleName, member.gradeName, shiftLabel(member.shift), teamText(member, allTeams)]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                · <span className={memberStatusClass(member.status)}>{memberStatusLabel(member.status)}</span>
              </p>
            </Link>
            <div className="flex shrink-0 justify-end gap-2">
              <Button tone="ghost" onClick={() => setEditing(member)}>
                Editar
              </Button>
              {pendingDelete === member.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(member.id, {
                        onSuccess: () => setPendingDelete(null),
                      })
                    }
                  >
                    Confirmar
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() => {
                      setPendingDelete(null);
                      remove.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  tone="ghost"
                  onClick={() => {
                    remove.reset();
                    setPendingDelete(member.id);
                  }}
                >
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
        {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
      </div>
      {editing !== undefined ? <MemberFormModal member={editing} onClose={() => setEditing(undefined)} /> : null}
    </div>
  );
}
