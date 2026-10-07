import { useState } from "react";
import type { LineDto, MachineDto, MachineOperationalStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Modal, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteMachine, useMachines, useSaveMachine } from "../data/cadastro";
import { machineStatusClass, machineStatusLabel, machineStatusOptions } from "../model/labels";

type Draft = Omit<MachineDto, "id">;

function emptyDraft(lineId: string): Draft {
  return { lineId, equipmentId: null, name: "", tag: "", manufacturer: "", status: "released", notes: "" };
}

function toBody(draft: Draft): Draft {
  return {
    ...draft,
    equipmentId: draft.equipmentId || null,
    tag: draft.tag || null,
    manufacturer: draft.manufacturer || null,
    notes: draft.notes || null,
  };
}

// Máquinas (equipamentos) de uma linha: aparecem como etiquetas no cartão da linha e abrem para editar.
export function LineMachines({ line }: { line: LineDto }) {
  const machines = useMachines();
  const catalog = useMatrixCatalog();
  const save = useSaveMachine();
  const remove = useDeleteMachine();
  const [editing, setEditing] = useState<MachineDto | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [asking, setAsking] = useState(false);
  const mine = (machines.data ?? []).filter((machine) => machine.lineId === line.id);
  const equipments = catalog.data?.equipments ?? [];
  const equipmentName = new Map(equipments.map((equipment) => [equipment.id, equipment.name]));
  const choices = equipments.filter((equipment) => !equipment.archived || equipment.id === draft?.equipmentId);

  function close() {
    setEditing(null);
    setDraft(null);
    setAsking(false);
    save.reset();
    remove.reset();
  }

  function create() {
    setEditing(null);
    setDraft(emptyDraft(line.id));
  }

  function edit(machine: MachineDto) {
    setEditing(machine);
    setDraft({
      lineId: machine.lineId,
      equipmentId: machine.equipmentId,
      name: machine.name,
      tag: machine.tag ?? "",
      manufacturer: machine.manufacturer ?? "",
      status: machine.status,
      notes: machine.notes ?? "",
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">Máquinas</span>
      {mine.length === 0 ? <span className="text-sm text-muted">Nenhuma ainda.</span> : null}
      {mine.map((machine) => (
        <button
          key={machine.id}
          type="button"
          onClick={() => edit(machine)}
          className="rounded-control border border-line bg-chip px-2.5 py-1 text-sm text-app transition hover:bg-accent-soft"
        >
          {machine.name}
          {machine.equipmentId ? <span className="text-muted"> · {equipmentName.get(machine.equipmentId) ?? "Modelo"}</span> : null}
          {machine.status === "stopped" ? (
            <span className={machineStatusClass(machine.status)}> · {machineStatusLabel(machine.status)}</span>
          ) : null}
        </button>
      ))}
      <Button tone="ghost" className="px-2.5 py-1" onClick={create}>
        + Máquina
      </Button>
      <Modal open={draft !== null} title={editing ? `Editar máquina · ${line.name}` : `Nova máquina · ${line.name}`} onClose={close}>
        {draft ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ id: editing?.id, body: toBody(draft) }, { onSuccess: close });
            }}
          >
            <Field label="Nome">
              <TextInput
                value={draft.name}
                placeholder="Encartuchadeira"
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </Field>
            <Field label="Modelo de equipamento">
              <SelectInput
                value={draft.equipmentId ?? ""}
                onChange={(event) => setDraft({ ...draft, equipmentId: event.target.value || null })}
              >
                <option value="">Sem modelo</option>
                {choices.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <p className="-mt-2 text-xs text-muted">O modelo dá os subconjuntos da máquina e é o mesmo equipamento da matriz de habilidades.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="TAG">
                <TextInput value={draft.tag ?? ""} onChange={(event) => setDraft({ ...draft, tag: event.target.value })} />
              </Field>
              <Field label="Fabricante">
                <TextInput
                  value={draft.manufacturer ?? ""}
                  onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })}
                />
              </Field>
            </div>
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
            <Field label="Observações">
              <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </Field>
            {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
            {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={save.isPending}>
                Gravar
              </Button>
              <Button tone="ghost" onClick={close}>
                Cancelar
              </Button>
              {editing ? (
                asking ? (
                  <Button tone="danger" className="sm:ml-auto" disabled={remove.isPending} onClick={() => remove.mutate(editing.id, { onSuccess: close })}>
                    Confirmar exclusão
                  </Button>
                ) : (
                  <Button tone="ghost" className="sm:ml-auto" onClick={() => setAsking(true)}>
                    Excluir
                  </Button>
                )
              ) : null}
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
