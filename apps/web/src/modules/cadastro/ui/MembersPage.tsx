import { useState } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, MemberShift, MemberStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteMember, useGrades, useRoles, useSaveMember, useMembers, type MemberWrite } from "../data/cadastro";
import { shiftLabel, shiftOptions, memberStatusClass, memberStatusLabel, memberStatusOptions } from "../model/labels";

const empty: MemberWrite = {
  name: "",
  roleId: "",
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

export function MembersPage() {
  const members = useMembers();
  const roles = useRoles();
  const grades = useGrades();
  const save = useSaveMember();
  const remove = useDeleteMember();
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

  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Colaboradores"
        text="Etiqueta do gestor. Sem login."
        action={<Button onClick={create}>Novo colaborador</Button>}
      />
      {members.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {members.data?.length === 0 ? <Card>Nenhum colaborador ainda.</Card> : null}
        {members.data?.map((member) => (
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
                {member.roleName}
                {member.gradeName ? ` · ${member.gradeName}` : ""} · {shiftLabel(member.shift)} ·{" "}
                <span className={memberStatusClass(member.status)}>{memberStatusLabel(member.status)}</span>
              </p>
            </button>
            <div className="flex shrink-0 justify-end gap-2">
              <Link
                to={`/competencias/${member.id}`}
                className="inline-flex items-center justify-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft"
              >
                Matriz
              </Link>
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
            <Field label="Função">
              <SelectInput value={draft.roleId} onChange={(event) => setDraft({ ...draft, roleId: event.target.value })}>
                <option value="">Escolha</option>
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
