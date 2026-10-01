import { useState, type FormEvent } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMachines, useTechnicians } from "../../cadastro/data/cadastro";
import { useUpdateRecord } from "../data/records";
import { fromLocalInput, toLocalInput } from "../model/record";

export function ProblemSheet({ record }: { record: RecordDto }) {
  const machines = useMachines();
  const technicians = useTechnicians();
  const update = useUpdateRecord(record.id);
  const initialMode = record.machineLabel ? "other" : "machine";
  const [body, setBody] = useState(record.body);
  const [when, setWhen] = useState(toLocalInput(record.occurredAt));
  const [technicianId, setTechnicianId] = useState(record.technicianId ?? "");
  const [mode, setMode] = useState<"machine" | "other">(initialMode);
  const [machineId, setMachineId] = useState(record.machineId ?? "");
  const [machineLabel, setMachineLabel] = useState(record.machineLabel ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      body,
      occurredAt: fromLocalInput(when),
      technicianId: technicianId || null,
      machineId: mode === "machine" ? machineId || null : null,
      machineLabel: mode === "other" ? machineLabel || null : null,
      notes: record.notes,
    });
  }

  return (
    <Card>
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <Field label="Texto">
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <Field label="Quando">
          <TextInput type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </Field>
        <Field label="Quem, se souber">
          <SelectInput value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
            <option value="">Não sei</option>
            {technicians.data?.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={mode === "machine"}
            onClick={() => setMode("machine")}
            className={`rounded-control border px-3 py-3 text-sm font-medium transition ${mode === "machine" ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-chip"}`}
          >
            Máquina cadastrada
          </button>
          <button
            type="button"
            aria-pressed={mode === "other"}
            onClick={() => setMode("other")}
            className={`rounded-control border px-3 py-3 text-sm font-medium transition ${mode === "other" ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-chip"}`}
          >
            Outra
          </button>
        </div>
        {mode === "machine" ? (
          <Field label="Máquina">
            <SelectInput value={machineId} onChange={(event) => setMachineId(event.target.value)}>
              <option value="">Escolha</option>
              {machines.data?.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : (
          <Field label="Outra">
            <TextInput
              value={machineLabel}
              placeholder="Descreva o equipamento"
              onChange={(event) => setMachineLabel(event.target.value)}
            />
          </Field>
        )}
        {update.isError ? <Notice>{errorMessage(update.error)}</Notice> : null}
        {update.isSuccess ? <p className="text-sm font-medium text-accent">Ficha gravada.</p> : null}
        <Button type="submit" disabled={update.isPending}>
          Gravar ficha
        </Button>
      </form>
    </Card>
  );
}
