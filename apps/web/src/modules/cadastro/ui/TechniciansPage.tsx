import { useState } from "react";
import type { TechnicianDto, TechnicianShift, TechnicianStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteTechnician, useRoles, useSaveTechnician, useTechnicians, type TechnicianWrite } from "../data/cadastro";
import { shiftLabel, shiftOptions, technicianStatusLabel, technicianStatusOptions } from "../model/labels";

const empty: TechnicianWrite = {
  name: "",
  roleId: "",
  shift: "first",
  area: "",
  status: "active",
  registration: "",
  contact: "",
  notes: "",
};

function fromDto(technician: TechnicianDto): TechnicianWrite {
  return {
    name: technician.name,
    roleId: technician.roleId,
    shift: technician.shift,
    area: technician.area ?? "",
    status: technician.status,
    registration: technician.registration ?? "",
    contact: technician.contact ?? "",
    notes: technician.notes ?? "",
  };
}

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export function TechniciansPage() {
  const technicians = useTechnicians();
  const roles = useRoles();
  const save = useSaveTechnician();
  const remove = useDeleteTechnician();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TechnicianWrite>(empty);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function reset() {
    setEditingId(null);
    setDraft(empty);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <PageTitle eyebrow="Apoio" title="Técnicos" text="Etiqueta do gestor. Sem login." />
        <div className="flex flex-col gap-3">
          {technicians.data?.length === 0 ? <Card>Nenhum técnico ainda.</Card> : null}
          {technicians.data?.map((technician) => (
            <Card key={technician.id} className="flex items-start justify-between gap-3">
              <button
                type="button"
                className="text-left"
                onClick={() => {
                  setEditingId(technician.id);
                  setDraft(fromDto(technician));
                }}
              >
                <p className="font-medium">{technician.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {technician.roleName} · {shiftLabel(technician.shift)} · {technicianStatusLabel(technician.status)}
                </p>
              </button>
              {pendingDelete === technician.id ? (
                <Button
                  tone="danger"
                  onClick={() =>
                    remove.mutate(technician.id, {
                      onSuccess: () => {
                        setPendingDelete(null);
                        if (editingId === technician.id) reset();
                      },
                    })
                  }
                >
                  Confirmar
                </Button>
              ) : (
                <Button tone="ghost" onClick={() => setPendingDelete(technician.id)}>
                  Excluir
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <form
          className="flex flex-col gap-3"
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
              { onSuccess: reset },
            );
          }}
        >
          <h2 className="text-lg font-semibold">{editingId ? "Editar técnico" : "Novo técnico"}</h2>
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
          <Field label="Turno">
            <SelectInput
              value={draft.shift}
              onChange={(event) => setDraft({ ...draft, shift: event.target.value as TechnicianShift })}
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
              onChange={(event) => setDraft({ ...draft, status: event.target.value as TechnicianStatus })}
            >
              {technicianStatusOptions.map((option) => (
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
          <Field label="Observações">
            <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <Button type="submit" disabled={save.isPending}>
            Gravar
          </Button>
          {editingId ? (
            <Button tone="ghost" onClick={reset}>
              Cancelar
            </Button>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
