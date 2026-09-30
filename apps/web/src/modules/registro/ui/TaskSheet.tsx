import { useState, type FormEvent } from "react";
import type { RecordDto, RecordPriority, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useFactories, useTechnicians } from "../../cadastro/data/cadastro";
import { useAddAttachment, useRemoveAttachment, useUpdateRecord } from "../data/records";
import { fromLocalInput, priorityOptions, statusOptions, toLocalInput } from "../model/record";

export function TaskSheet({ record }: { record: RecordDto }) {
  const factories = useFactories();
  const technicians = useTechnicians();
  const update = useUpdateRecord(record.id);
  const add = useAddAttachment(record.id);
  const remove = useRemoveAttachment(record.id);
  const [body, setBody] = useState(record.body);
  const [when, setWhen] = useState(toLocalInput(record.occurredAt));
  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [technicianId, setTechnicianId] = useState(record.technicianId ?? "");
  const [factoryId, setFactoryId] = useState(record.factoryId ?? "");
  const [tag, setTag] = useState(record.tag ?? "");
  const [line, setLine] = useState(record.line ?? "");
  const [priority, setPriority] = useState<RecordPriority | "">(record.priority ?? "");
  const [due, setDue] = useState(record.dueAt ? toLocalInput(record.dueAt) : "");
  const [notes, setNotes] = useState(record.notes ?? "");
  const [file, setFile] = useState<File | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      body,
      occurredAt: fromLocalInput(when),
      status,
      technicianId: technicianId || null,
      factoryId: factoryId || null,
      tag: tag || null,
      line: line || null,
      priority: priority || null,
      dueAt: due ? fromLocalInput(due) : null,
      notes: notes || null,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
          <Field label="Texto">
            <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
          </Field>
          <Field label="Quando">
            <input
              type="datetime-local"
              className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-app"
              value={when}
              onChange={(event) => setWhen(event.target.value)}
            />
          </Field>
          <Field label="Responsável">
            <SelectInput value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
              <option value="">Ninguém</option>
              {technicians.data?.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Prazo">
            <input
              type="datetime-local"
              className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-app"
              value={due}
              onChange={(event) => setDue(event.target.value)}
            />
          </Field>
          <Field label="Prioridade">
            <SelectInput
              value={priority}
              onChange={(event) => setPriority(event.target.value as RecordPriority | "")}
            >
              <option value="">Sem prioridade</option>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={(event) => setStatus(event.target.value as RecordStatus)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Observação">
            <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </Field>
          <Field label="Fábrica">
            <SelectInput value={factoryId} onChange={(event) => setFactoryId(event.target.value)}>
              <option value="">Nenhuma</option>
              {factories.data?.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="TAG">
            <TextInput value={tag} onChange={(event) => setTag(event.target.value)} />
          </Field>
          <Field label="Linha">
            <TextInput value={line} onChange={(event) => setLine(event.target.value)} />
          </Field>
          {update.isError ? <Notice>{errorMessage(update.error)}</Notice> : null}
          {update.isSuccess ? <p className="text-sm text-muted">Ficha gravada.</p> : null}
          <Button type="submit" disabled={update.isPending}>
            Gravar ficha
          </Button>
        </form>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Anexo</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {record.attachments.length === 0 ? <li className="text-sm text-muted">Nenhum arquivo.</li> : null}
          {record.attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between gap-3 text-sm">
              <a className="font-medium text-accent" href={`/api/records/${record.id}/attachments/${attachment.id}`}>
                {attachment.fileName}
              </a>
              <Button tone="ghost" onClick={() => remove.mutate(attachment.id)}>
                Remover
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-sm text-app"
          />
          <Button
            tone="ghost"
            disabled={!file || add.isPending}
            onClick={() => {
              if (!file) return;
              add.mutate(file, { onSuccess: () => setFile(null) });
            }}
          >
            Anexar
          </Button>
        </div>
        {add.isError ? <Notice>{errorMessage(add.error)}</Notice> : null}
      </Card>
    </div>
  );
}
