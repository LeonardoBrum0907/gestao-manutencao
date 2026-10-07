import { useState } from "react";
import type { MemberDto, TeamDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { PanelFooter, SidePanel } from "../../../design/ui/panel";
import { RemovalPrompt } from "../../../design/ui/removal";
import { RowMenu } from "../../../design/ui/row-menu";
import { useToast } from "../../../design/ui/toast";
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
  onRemove,
}: {
  team: TeamDto;
  members: MemberDto[];
  teams: TeamDto[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const membership = useTeamMembership();
  const toast = useToast();
  const byId = new Map(members.map((member) => [member.id, member]));
  const people = team.memberIds.flatMap((id) => byId.get(id) ?? []);
  const supervisor = team.supervisorId ? byId.get(team.supervisorId) : undefined;
  const candidates = members.filter((member) => member.position === "technician" && member.teamId !== team.id);
  const teamName = new Map(teams.map((item) => [item.id, item.name]));

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
          <span className="block text-base font-semibold text-app transition hover:text-accent">{team.name}</span>
          <span className="mt-1 block text-sm text-muted">
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
          </span>
          {team.description ? <span className="mt-1 block text-sm text-muted">{team.description}</span> : null}
        </button>
        <RowMenu
          label={`Mais ações de ${team.name}`}
          items={[
            { label: "Editar", onSelect: onEdit },
            { label: "Excluir…", danger: true, onSelect: onRemove },
          ]}
        />
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
              onClick={() =>
                membership.mutate(
                  { teamId: team.id, memberId: member.id, action: "remove" },
                  {
                    onSuccess: () =>
                      toast({
                        text: `${member.name} saiu de ${team.name}.`,
                        action: { label: "Desfazer", run: () => membership.mutate({ teamId: team.id, memberId: member.id, action: "add" }) },
                      }),
                  },
                )
              }
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
      {membership.error ? (
        <div className="mt-3">
          <Notice>{errorMessage(membership.error)}</Notice>
        </div>
      ) : null}
    </Card>
  );
}

// Nome, supervisor e descrição da equipe num painel ao lado; os técnicos se mexem no próprio cartão.
function TeamPanel({
  team,
  members,
  startRemoving,
  onClose,
}: {
  team: TeamDto | null;
  members: MemberDto[];
  startRemoving?: boolean;
  onClose: () => void;
}) {
  const save = useSaveTeam();
  const remove = useDeleteTeam();
  const toast = useToast();
  const [initial] = useState<TeamWrite>(() =>
    team ? { name: team.name, description: team.description ?? "", supervisorId: team.supervisorId } : empty,
  );
  const [draft, setDraft] = useState<TeamWrite>(initial);
  const [removing, setRemoving] = useState(Boolean(startRemoving));
  const supervisors = members.filter((member) => member.position === "supervisor");
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  return (
    <SidePanel
      open
      eyebrow={team ? "Equipe" : "Nova"}
      title={team ? team.name : "Nova equipe"}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { id: team?.id, body: { ...draft, description: blankToNull(draft.description) } },
          {
            onSuccess: (saved) => {
              toast({ text: team ? "Alterações gravadas." : `${saved.name} criada.` });
              onClose();
            },
          },
        );
      }}
      notice={
        team && removing ? (
          <RemovalPrompt
            path={`/api/teams/${team.id}`}
            name={team.name}
            removing={remove.isPending}
            error={remove.error}
            onCancel={() => {
              setRemoving(false);
              remove.reset();
            }}
            onConfirm={() =>
              remove.mutate(team.id, {
                onSuccess: () => {
                  toast({ text: `${team.name} excluída.` });
                  onClose();
                },
              })
            }
          />
        ) : null
      }
      footer={
        <PanelFooter
          saving={save.isPending}
          saveLabel={team ? "Gravar" : "Criar equipe"}
          dirty={Boolean(team) && dirty}
          onCancel={onClose}
          onRemove={team && !removing ? () => setRemoving(true) : undefined}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nome">
          <TextInput value={draft.name} placeholder="Ex.: Turno da noite" onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <Field label="Supervisor">
          <SelectInput value={draft.supervisorId ?? ""} onChange={(event) => setDraft({ ...draft, supervisorId: event.target.value || null })}>
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
          <TextArea value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </Field>
        <p className="text-sm text-muted">Os técnicos entram e saem pelo cartão da equipe, na lista.</p>
        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
      </div>
    </SidePanel>
  );
}

export function TeamsPage() {
  const teams = useTeams();
  const members = useMembers();
  // undefined: fechado; null: nova; equipe: aberta (e, se pedido, já na pergunta de exclusão).
  const [open, setOpen] = useState<{ team: TeamDto | null; removing?: boolean } | undefined>(undefined);

  return (
    <div>
      <PageTitle
        eyebrow="Equipe"
        title="Equipes"
        text="Cada equipe tem um supervisor e seus técnicos. Um técnico fica em uma equipe só."
        action={<Button onClick={() => setOpen({ team: null })}>Nova equipe</Button>}
      />
      {teams.isPending || members.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-3">
        {teams.data?.length === 0 ? <Card>Nenhuma equipe ainda.</Card> : null}
        {teams.data && members.data
          ? teams.data.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                members={members.data}
                teams={teams.data}
                onEdit={() => setOpen({ team })}
                onRemove={() => setOpen({ team, removing: true })}
              />
            ))
          : null}
      </div>
      {open ? (
        <TeamPanel
          key={`${open.team?.id ?? "nova"}-${open.removing ? "excluir" : "editar"}`}
          team={open.team}
          members={members.data ?? []}
          startRemoving={open.removing}
          onClose={() => setOpen(undefined)}
        />
      ) : null}
    </div>
  );
}
