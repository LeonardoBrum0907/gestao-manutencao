import { useState, type FormEvent } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useTechnicians } from "../../cadastro/data/cadastro";
import { useUpdateRecord } from "../data/records";
import { fromLocalInput, toLocalInput } from "../model/record";

export function FeedbackSheet({ record }: { record: RecordDto }) {
  const technicians = useTechnicians();
  const update = useUpdateRecord(record.id);
  const [body, setBody] = useState(record.body);
  const [when, setWhen] = useState(toLocalInput(record.occurredAt));
  const [technicianId, setTechnicianId] = useState(record.technicianId ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      body,
      occurredAt: fromLocalInput(when),
      technicianId: technicianId || null,
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
        <Field label="Alvo">
          <SelectInput value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
            <option value="">Ninguém</option>
            {technicians.data?.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        {update.isError ? <Notice>{errorMessage(update.error)}</Notice> : null}
        {update.isSuccess ? <p className="text-sm font-medium text-accent">Ficha gravada.</p> : null}
        <Button type="submit" disabled={update.isPending}>
          Gravar ficha
        </Button>
      </form>
    </Card>
  );
}
