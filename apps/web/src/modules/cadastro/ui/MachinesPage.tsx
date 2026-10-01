import { useState } from "react";
import type { MachineDto, MachineOperationalStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useDeleteMachine, useFactories, useMachines, useSaveMachine } from "../data/cadastro";
import { machineStatusClass, machineStatusLabel, machineStatusOptions } from "../model/labels";

type Draft = Omit<MachineDto, "id">;

const empty: Draft = {
  name: "",
  factoryId: "",
  sector: "",
  manufacturer: "",
  internalCode: "",
  status: "implanting",
  notes: "",
  isDailyLine: false,
  isCritical: false,
};

function toDraft(machine: MachineDto): Draft {
  return {
    name: machine.name,
    factoryId: machine.factoryId,
    sector: machine.sector ?? "",
    manufacturer: machine.manufacturer ?? "",
    internalCode: machine.internalCode ?? "",
    status: machine.status,
    notes: machine.notes ?? "",
    isDailyLine: machine.isDailyLine,
    isCritical: machine.isCritical,
  };
}

function toBody(draft: Draft): Draft {
  return {
    ...draft,
    sector: draft.sector || null,
    manufacturer: draft.manufacturer || null,
    internalCode: draft.internalCode || null,
    notes: draft.notes || null,
  };
}

export function MachinesPage() {
  const machines = useMachines();
  const factories = useFactories();
  const save = useSaveMachine();
  const remove = useDeleteMachine();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const factoryName = new Map(factories.data?.map((factory) => [factory.id, factory.name]));

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

  function edit(machine: MachineDto) {
    setEditingId(machine.id);
    setDraft(toDraft(machine));
    setOpen(true);
  }

  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Máquinas"
        text="Nome, fábrica e as duas marcas: linha de GD e apadrinhada."
        action={<Button onClick={create}>Nova máquina</Button>}
      />
      {machines.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {machines.data?.length === 0 ? <Card>Nenhuma máquina ainda.</Card> : null}
        {machines.data?.map((machine) => (
          <Card key={machine.id} compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="min-w-0 text-left" onClick={() => edit(machine)}>
              <p className="font-medium text-app transition hover:text-accent hover:underline">{machine.name}</p>
              <p className="mt-1 text-sm text-muted">
                {factoryName.get(machine.factoryId) ?? "Fábrica"} ·{" "}
                <span className={machineStatusClass(machine.status)}>{machineStatusLabel(machine.status)}</span>
                {machine.isDailyLine ? " · Linha de GD" : ""}
                {machine.isCritical ? " · Apadrinhada" : ""}
              </p>
            </button>
            <div className="flex shrink-0 justify-end gap-2">
              {pendingDelete === machine.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(machine.id, {
                        onSuccess: () => {
                          setPendingDelete(null);
                          if (editingId === machine.id) close();
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
                <Button tone="ghost" onClick={() => setPendingDelete(machine.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
        {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
      </div>
      <Modal open={open} title={editingId ? "Editar máquina" : "Nova máquina"} onClose={close}>
        <form
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editingId ?? undefined, body: toBody(draft) }, { onSuccess: close });
          }}
        >
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-app">Identificação</h3>
            <Field label="Nome">
              <TextInput value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Fábrica">
              <SelectInput
                value={draft.factoryId}
                onChange={(event) => setDraft({ ...draft, factoryId: event.target.value })}
              >
                <option value="">Escolha</option>
                {factories.data?.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Setor">
              <TextInput value={draft.sector ?? ""} onChange={(event) => setDraft({ ...draft, sector: event.target.value })} />
            </Field>
            <Field label="Fabricante">
              <TextInput
                value={draft.manufacturer ?? ""}
                onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })}
              />
            </Field>
            <Field label="Código interno">
              <TextInput
                value={draft.internalCode ?? ""}
                onChange={(event) => setDraft({ ...draft, internalCode: event.target.value })}
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as MachineOperationalStatus })}
              >
                {machineStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-app">Marcas e observação</h3>
            <Field label="Observações">
              <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isDailyLine}
                onChange={(event) => setDraft({ ...draft, isDailyLine: event.target.checked })}
              />
              Linha de Gerenciamento Diário
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isCritical}
                onChange={(event) => setDraft({ ...draft, isCritical: event.target.checked })}
              />
              Apadrinhada
            </label>
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
