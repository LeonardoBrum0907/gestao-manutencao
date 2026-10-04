import { useState } from "react";
import type { MemberDto, MemberPosition, MemberShift, MemberStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Modal, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useGrades, useRoles, useSaveMember, useTeams, type MemberWrite } from "../data/cadastro";
import { memberStatusOptions, positionOptions, shiftOptions } from "../model/labels";

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

// Montado só enquanto está aberto: cada abertura começa do colaborador (ou do vazio) de novo.
export function MemberFormModal({ member, onClose }: { member: MemberDto | null; onClose: () => void }) {
  const roles = useRoles();
  const grades = useGrades();
  const teams = useTeams();
  const save = useSaveMember();
  const [draft, setDraft] = useState<MemberWrite>(() => (member ? fromDto(member) : empty));
  const allTeams = teams.data ?? [];

  return (
    <Modal open title={member ? "Editar colaborador" : "Novo colaborador"} onClose={onClose}>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(
            {
              id: member?.id,
              body: {
                ...draft,
                area: blankToNull(draft.area),
                registration: blankToNull(draft.registration),
                contact: blankToNull(draft.contact),
                notes: blankToNull(draft.notes),
              },
            },
            { onSuccess: onClose },
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
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
