import { useState } from "react";
import type { LineDto, MachineDto, MachineOperationalStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Modal, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteMachine, useSaveMachine } from "../data/cadastro";
import { machineStatusOptions } from "../model/labels";

type Draft = Omit<MachineDto, "id">;

function draftOf(line: LineDto, machine: MachineDto | null): Draft {
  if (!machine) return { lineId: line.id, equipmentId: null, name: "", tag: "", manufacturer: "", status: "released", notes: "" };
  return {
    lineId: machine.lineId,
    equipmentId: machine.equipmentId,
    name: machine.name,
    tag: machine.tag ?? "",
    manufacturer: machine.manufacturer ?? "",
    status: machine.status,
    notes: machine.notes ?? "",
  };
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

// Cadastro de uma máquina (equipamento) da linha. Abre do cartão da linha (nova) e da tela da máquina (editar).
export function MachineFormModal({
  line,
  machine,
  onClose,
  onDeleted,
}: {
  line: LineDto;
  machine: MachineDto | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const catalog = useMatrixCatalog();
  const save = useSaveMachine();
  const remove = useDeleteMachine();
  const [draft, setDraft] = useState<Draft>(() => draftOf(line, machine));
  const [asking, setAsking] = useState(false);
  const equipments = catalog.data?.equipments ?? [];
  const choices = equipments.filter((equipment) => !equipment.archived || equipment.id === draft.equipmentId);

  return (
    <Modal open title={machine ? `Editar máquina · ${line.name}` : `Nova máquina · ${line.name}`} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate({ id: machine?.id, body: toBody(draft) }, { onSuccess: onClose });
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
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {machine ? (
            asking ? (
              <Button tone="danger" className="sm:ml-auto" disabled={remove.isPending} onClick={() => remove.mutate(machine.id, { onSuccess: onDeleted ?? onClose })}>
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
    </Modal>
  );
}
