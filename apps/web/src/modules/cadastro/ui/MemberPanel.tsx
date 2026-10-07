import { useState } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, MemberPosition, MemberShift, MemberStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { PanelFooter, PanelSection, PanelTag, SidePanel } from "../../../design/ui/panel";
import { RemovalPrompt } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useDeleteMember, useGrades, useRoles, useSaveMember, useTeams, type MemberWrite } from "../data/cadastro";
import { memberStatusLabel, memberStatusOptions, positionLabel, positionOptions, shiftOptions } from "../model/labels";

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

function toBody(draft: MemberWrite): MemberWrite {
  return {
    ...draft,
    area: blankToNull(draft.area),
    registration: blankToNull(draft.registration),
    contact: blankToNull(draft.contact),
    notes: blankToNull(draft.notes),
  };
}

// Cadastro do colaborador num painel ao lado da lista (ou da ficha). Excluir fica no pé do painel e,
// quando a pessoa já tem histórico, oferece marcar como Inativo no lugar.
// Montado só enquanto está aberto: cada abertura começa do colaborador (ou do vazio) de novo.
export function MemberPanel({
  member,
  showProfileLink = true,
  startRemoving = false,
  onClose,
  onDeleted,
}: {
  member: MemberDto | null;
  showProfileLink?: boolean;
  startRemoving?: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const roles = useRoles();
  const grades = useGrades();
  const teams = useTeams();
  const save = useSaveMember();
  const remove = useDeleteMember();
  const toast = useToast();
  const [initial] = useState<MemberWrite>(() => (member ? fromDto(member) : empty));
  const [draft, setDraft] = useState<MemberWrite>(initial);
  const [removing, setRemoving] = useState(startRemoving);
  const allTeams = teams.data ?? [];
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  return (
    <SidePanel
      open
      eyebrow={member ? positionLabel(member.position) : "Novo"}
      title={member ? member.name : "Novo colaborador"}
      meta={
        member ? (
          <>
            <PanelTag tone={member.status === "active" ? "accent" : "danger"}>{memberStatusLabel(member.status)}</PanelTag>
            {member.teamName ? <PanelTag>{member.teamName}</PanelTag> : null}
            {showProfileLink ? (
              <Link to={`/cadastro/colaboradores/${member.id}`} className="font-semibold text-accent hover:underline">
                Abrir ficha completa →
              </Link>
            ) : null}
          </>
        ) : null
      }
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(
          { id: member?.id, body: toBody(draft) },
          {
            onSuccess: (saved) => {
              toast({ text: member ? "Alterações gravadas." : `${saved.name} cadastrado.` });
              onClose();
            },
          },
        );
      }}
      notice={
        member && removing ? (
          <RemovalPrompt
            path={`/api/members/${member.id}`}
            name={member.name}
            removing={remove.isPending}
            error={remove.error ?? save.error}
            alternative={
              member.status === "inactive"
                ? undefined
                : {
                    label: "Marcar como Inativo",
                    pending: save.isPending,
                    onClick: () =>
                      save.mutate(
                        { id: member.id, body: { ...fromDto(member), status: "inactive" } },
                        {
                          onSuccess: () => {
                            toast({
                              text: `${member.name} marcado como Inativo.`,
                              action: { label: "Desfazer", run: () => save.mutate({ id: member.id, body: fromDto(member) }) },
                            });
                            onClose();
                          },
                        },
                      ),
                  }
            }
            onCancel={() => {
              setRemoving(false);
              remove.reset();
            }}
            onConfirm={() =>
              remove.mutate(member.id, {
                onSuccess: () => {
                  toast({ text: `${member.name} excluído.` });
                  (onDeleted ?? onClose)();
                },
              })
            }
          />
        ) : null
      }
      footer={
        <PanelFooter
          saving={save.isPending}
          saveLabel={member ? "Gravar" : "Cadastrar colaborador"}
          dirty={Boolean(member) && dirty}
          onCancel={onClose}
          onRemove={member && !removing ? () => setRemoving(true) : undefined}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PanelSection title="Identificação">
          <Field label="Nome">
            <TextInput value={draft.name} placeholder="Nome completo" onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
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
                <SelectInput value={draft.teamId ?? ""} onChange={(event) => setDraft({ ...draft, teamId: event.target.value || null })}>
                  <option value="">Sem equipe</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <p className="self-end text-sm text-muted">O supervisor é escolhido na equipe que ele lidera, em Equipes.</p>
            )}
            <Field label={draft.position === "technician" ? "Função" : "Função (opcional)"}>
              <SelectInput value={draft.roleId ?? ""} onChange={(event) => setDraft({ ...draft, roleId: event.target.value || null })}>
                <option value="">{draft.position === "technician" ? "Escolha" : "Sem função"}</option>
                {roles.data?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Grau">
              <SelectInput value={draft.gradeId ?? ""} onChange={(event) => setDraft({ ...draft, gradeId: event.target.value || null })}>
                <option value="">Sem grau</option>
                {grades.data?.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Turno">
              <SelectInput value={draft.shift} onChange={(event) => setDraft({ ...draft, shift: event.target.value as MemberShift })}>
                {shiftOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as MemberStatus })}>
                {memberStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </PanelSection>
        <PanelSection title="Contato e registro">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Matrícula">
              <TextInput value={draft.registration ?? ""} onChange={(event) => setDraft({ ...draft, registration: event.target.value })} />
            </Field>
            <Field label="Contato">
              <TextInput value={draft.contact ?? ""} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} />
            </Field>
          </div>
          <Field label="Área">
            <TextInput value={draft.area ?? ""} onChange={(event) => setDraft({ ...draft, area: event.target.value })} />
          </Field>
        </PanelSection>
        <Field label="Observações">
          <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </Field>
        {save.isError && !removing ? <Notice>{errorMessage(save.error)}</Notice> : null}
      </div>
    </SidePanel>
  );
}
