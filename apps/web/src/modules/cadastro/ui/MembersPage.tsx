import { useState } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, MemberPosition, MemberShift, MemberStatus, TeamDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteMember, useGrades, useMembers, useRoles, useSaveMember, useTeams, type MemberWrite } from "../data/cadastro";
import {
  memberStatusClass,
  memberStatusLabel,
  memberStatusOptions,
  positionLabel,
  positionOptions,
  shiftLabel,
  shiftOptions,
} from "../model/labels";

const empty: MemberWrite = {
  name: "",
  position: "technician",
  teamId: null,
  roleId: null,
  gradeId: null,
  shift: "first",
  area: "",
  status: "active",
  registration: "",
  contact: "",
  notes: "",
};

function fromDto(member: MemberDto): MemberWrite {
  return {
    name: member.name,
    position: member.position,
    teamId: member.teamId,
    roleId: member.roleId,
    gradeId: member.gradeId,
    shift: member.shift,
    area: member.area ?? "",
    status: member.status,
    registration: member.registration ?? "",
    contact: member.contact ?? "",
    notes: member.notes ?? "",
  };
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

const NO_TEAM = "none";

// O supervisor pertence à equipe que lidera; o técnico, à equipe em que está.
function teamsOf(member: MemberDto, teams: TeamDto[]): TeamDto[] {
  return member.position === "supervisor"
    ? teams.filter((team) => team.supervisorId === member.id)
    : teams.filter((team) => team.id === member.teamId);
}

function teamText(member: MemberDto, teams: TeamDto[]): string | null {
  const names = teamsOf(member, teams).map((team) => team.name);
  if (!names.length) return null;
  return member.position === "supervisor" ? `lidera ${names.join(", ")}` : names[0];
}

export function MembersPage() {
  const members = useMembers();
  const roles = useRoles();
  const grades = useGrades();
  const save = useSaveMember();
  const remove = useDeleteMember();
  const teams = useTeams();
  const [positionFilter, setPositionFilter] = useState<MemberPosition | "">("");
  const [teamFilter, setTeamFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberWrite>(empty);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setEditingId(null);
    setDraft(empty);
  }

  function create() {
    setEditingId(null);
    setDraft(empty);
    setOpen(true);
  }

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
        eyebrow="Apoio"
        title="Colaboradores"
        text="Etiqueta do gestor. Sem login."
        action={<Button onClick={create}>Novo colaborador</Button>}
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
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => {
                setEditingId(member.id);
                setDraft(fromDto(member));
                setOpen(true);
              }}
            >
              <p className="font-medium text-app transition hover:text-accent hover:underline">{member.name}</p>
              <p className="mt-1 text-sm text-muted">
                {[positionLabel(member.position), member.roleName, member.gradeName, shiftLabel(member.shift), teamText(member, allTeams)]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                · <span className={memberStatusClass(member.status)}>{memberStatusLabel(member.status)}</span>
              </p>
            </button>
            <div className="flex shrink-0 justify-end gap-2">
              {member.position === "technician" ? (
                <Link
                  to={`/competencias/${member.id}`}
                  className="inline-flex items-center justify-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft"
                >
                  Matriz
                </Link>
              ) : null}
              {pendingDelete === member.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(member.id, {
                        onSuccess: () => {
                          setPendingDelete(null);
                          if (editingId === member.id) close();
                        },
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
      <Modal open={open} title={editingId ? "Editar colaborador" : "Novo colaborador"} onClose={close}>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              {
                id: editingId ?? undefined,
                body: {
                  ...draft,
                  area: blankToNull(draft.area),
                  registration: blankToNull(draft.registration),
                  contact: blankToNull(draft.contact),
                  notes: blankToNull(draft.notes),
                },
              },
              { onSuccess: close },
            );
          }}
        >
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-app">Identificação</h3>
            <Field label="Nome">
              <TextInput value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Cargo">
              <SelectInput
                value={draft.position}
                onChange={(event) => {
                  const position = event.target.value as MemberPosition;
                  setDraft({ ...draft, position, teamId: position === "supervisor" ? null : draft.teamId });
                }}
              >
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            {draft.position === "technician" ? (
              <Field label="Equipe">
                <SelectInput
                  value={draft.teamId ?? ""}
                  onChange={(event) => setDraft({ ...draft, teamId: event.target.value || null })}
                >
                  <option value="">Sem equipe</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <p className="text-sm text-muted">O supervisor é escolhido na equipe que ele lidera, em Equipes.</p>
            )}
            <Field label={draft.position === "technician" ? "Função" : "Função (opcional)"}>
              <SelectInput
                value={draft.roleId ?? ""}
                onChange={(event) => setDraft({ ...draft, roleId: event.target.value || null })}
              >
                <option value="">{draft.position === "technician" ? "Escolha" : "Sem função"}</option>
                {roles.data?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Grau">
              <SelectInput
                value={draft.gradeId ?? ""}
                onChange={(event) => setDraft({ ...draft, gradeId: event.target.value || null })}
              >
                <option value="">Sem grau</option>
                {grades.data?.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Turno">
              <SelectInput
                value={draft.shift}
                onChange={(event) => setDraft({ ...draft, shift: event.target.value as MemberShift })}
              >
                {shiftOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Área">
              <TextInput value={draft.area ?? ""} onChange={(event) => setDraft({ ...draft, area: event.target.value })} />
            </Field>
            <Field label="Status">
              <SelectInput
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as MemberStatus })}
              >
                {memberStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Matrícula">
              <TextInput
                value={draft.registration ?? ""}
                onChange={(event) => setDraft({ ...draft, registration: event.target.value })}
              />
            </Field>
            <Field label="Contato">
              <TextInput value={draft.contact ?? ""} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} />
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-app">Observação</h3>
            <Field label="Observações">
              <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </Field>
          </div>
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
