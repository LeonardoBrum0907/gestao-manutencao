import { useState } from "react";
import type { TechnicianDto, TechnicianShift, TechnicianStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteTechnician, useRoles, useSaveTechnician, useTechnicians, type TechnicianWrite } from "../data/cadastro";
import { shiftLabel, shiftOptions, technicianStatusClass, technicianStatusLabel, technicianStatusOptions } from "../model/labels";

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
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TechnicianWrite>(empty);
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
        title="Técnicos"
        text="Etiqueta do gestor. Sem login."
        action={<Button onClick={create}>Novo técnico</Button>}
      />
      {technicians.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {technicians.data?.length === 0 ? <Card>Nenhum técnico ainda.</Card> : null}
        {technicians.data?.map((technician) => (
          <Card key={technician.id} compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => {
                setEditingId(technician.id);
                setDraft(fromDto(technician));
                setOpen(true);
              }}
            >
              <p className="font-medium text-app transition hover:text-accent hover:underline">{technician.name}</p>
              <p className="mt-1 text-sm text-muted">
                {technician.roleName} · {shiftLabel(technician.shift)} ·{" "}
                <span className={technicianStatusClass(technician.status)}>{technicianStatusLabel(technician.status)}</span>
              </p>
            </button>
            <div className="flex shrink-0 justify-end gap-2">
              {pendingDelete === technician.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(technician.id, {
                        onSuccess: () => {
                          setPendingDelete(null);
                          if (editingId === technician.id) close();
                        },
                      })
                    }
                  >
                    Confirmar
                  </Button>
                  <Button tone="ghost" onClick={() => setPendingDelete(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button tone="ghost" onClick={() => setPendingDelete(technician.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} title={editingId ? "Editar técnico" : "Novo técnico"} onClose={close}>
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
