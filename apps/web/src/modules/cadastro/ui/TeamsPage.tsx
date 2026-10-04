import { useState } from "react";
import type { MemberDto, TeamDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteTeam, useMembers, useSaveTeam, useTeamMembership, useTeams, type TeamWrite } from "../data/cadastro";
import { memberStatusClass, memberStatusLabel, shiftLabel } from "../model/labels";

const empty: TeamWrite = { name: "", description: "", supervisorId: null };

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function TeamCard({
  team,
  members,
  teams,
  onEdit,
}: {
  team: TeamDto;
  members: MemberDto[];
  teams: TeamDto[];
  onEdit: () => void;
}) {
  const membership = useTeamMembership();
  const remove = useDeleteTeam();
  const [pendingDelete, setPendingDelete] = useState(false);
  const byId = new Map(members.map((member) => [member.id, member]));
  const people = team.memberIds.flatMap((id) => byId.get(id) ?? []);
  const supervisor = team.supervisorId ? byId.get(team.supervisorId) : undefined;
  const candidates = members.filter((member) => member.position === "technician" && member.teamId !== team.id);
  const teamName = new Map(teams.map((item) => [item.id, item.name]));
  const error = membership.error ?? remove.error;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            className="text-left text-base font-semibold text-app transition hover:text-accent hover:underline"
            onClick={onEdit}
          >
            {team.name}
          </button>
          <p className="mt-1 text-sm text-muted">
            {supervisor ? (
              <>
                Supervisor: <span className="text-app">{supervisor.name}</span>
                {supervisor.status !== "active" ? (
                  <span className={memberStatusClass(supervisor.status)}> ({memberStatusLabel(supervisor.status)})</span>
                ) : null}
              </>
            ) : (
              "Sem supervisor"
            )}
            {" · "}
            {people.length === 1 ? "1 técnico" : `${people.length} técnicos`}
          </p>
          {team.description ? <p className="mt-1 text-sm text-muted">{team.description}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {pendingDelete ? (
            <>
              <Button tone="danger" onClick={() => remove.mutate(team.id, { onSuccess: () => setPendingDelete(false) })}>
                Confirmar
              </Button>
              <Button
                tone="ghost"
                onClick={() => {
                  setPendingDelete(false);
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
                setPendingDelete(true);
              }}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
      <ul className="mt-4 flex flex-col">
        {people.length === 0 ? <li className="text-sm text-muted">Nenhum técnico nesta equipe.</li> : null}
        {people.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 border-t border-t-line py-2 first:border-t-0 first:pt-0"
          >
            <p className="min-w-0 text-sm text-app">
              {member.name}
              <span className="text-muted">
                {" · "}
                {[member.roleName, shiftLabel(member.shift)].filter(Boolean).join(" · ")}
              </span>
            </p>
            <Button
              tone="ghost"
              className="shrink-0 px-3 py-1.5"
              disabled={membership.isPending}
              onClick={() => membership.mutate({ teamId: team.id, memberId: member.id, action: "remove" })}
            >
              Tirar
            </Button>
          </li>
        ))}
      </ul>
      {candidates.length ? (
        <div className="mt-3 sm:max-w-sm">
          <SelectInput
            aria-label={`Adicionar técnico em ${team.name}`}
            value=""
            disabled={membership.isPending}
            onChange={(event) => {
              if (event.target.value) membership.mutate({ teamId: team.id, memberId: event.target.value, action: "add" });
            }}
          >
            <option value="">Adicionar técnico…</option>
            {candidates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.teamId ? ` (sai de ${teamName.get(member.teamId) ?? "outra equipe"})` : ""}
              </option>
            ))}
          </SelectInput>
        </div>
      ) : null}
      {error ? (
        <div className="mt-3">
          <Notice>{errorMessage(error)}</Notice>
        </div>
      ) : null}
    </Card>
  );
}

export function TeamsPage() {
  const teams = useTeams();
  const members = useMembers();
  const save = useSaveTeam();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TeamWrite>(empty);
  const supervisors = members.data?.filter((member) => member.position === "supervisor") ?? [];

  function close() {
    setOpen(false);
    setEditingId(null);
    setDraft(empty);
    save.reset();
  }

  function create() {
    setEditingId(null);
    setDraft(empty);
    setOpen(true);
  }

  function edit(team: TeamDto) {
    setEditingId(team.id);
    setDraft({ name: team.name, description: team.description ?? "", supervisorId: team.supervisorId });
    setOpen(true);
  }

  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Equipes"
        text="Cada equipe tem um supervisor e seus técnicos. Um técnico fica em uma equipe só."
        action={<Button onClick={create}>Nova equipe</Button>}
      />
      {teams.isPending || members.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-3">
        {teams.data?.length === 0 ? <Card>Nenhuma equipe ainda.</Card> : null}
        {teams.data && members.data
          ? teams.data.map((team) => (
              <TeamCard key={team.id} team={team} members={members.data} teams={teams.data} onEdit={() => edit(team)} />
            ))
          : null}
      </div>
      <Modal open={open} title={editingId ? "Editar equipe" : "Nova equipe"} onClose={close}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              { id: editingId ?? undefined, body: { ...draft, description: blankToNull(draft.description) } },
              { onSuccess: close },
            );
          }}
        >
          <Field label="Nome">
            <TextInput
              value={draft.name}
              placeholder="Ex.: Turno da noite"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Field>
          <Field label="Supervisor">
            <SelectInput
              value={draft.supervisorId ?? ""}
              onChange={(event) => setDraft({ ...draft, supervisorId: event.target.value || null })}
            >
              <option value="">Sem supervisor</option>
              {supervisors.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.status !== "active" ? ` (${memberStatusLabel(member.status)})` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          {supervisors.length === 0 ? (
            <p className="text-sm text-muted">Nenhum supervisor ainda. Cadastre em Colaboradores, com o cargo Supervisor.</p>
          ) : null}
          <Field label="Descrição">
            <TextArea
              value={draft.description ?? ""}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              Gravar
            </Button>
            <Button tone="ghost" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
