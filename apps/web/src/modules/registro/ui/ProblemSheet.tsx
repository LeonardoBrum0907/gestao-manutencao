import { useState, type FormEvent } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useLines, useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { useUpdateRecord } from "../data/records";
import { fromLocalInput, toLocalInput } from "../model/record";

export function ProblemSheet({ record }: { record: RecordDto }) {
  const lines = useLines();
  const members = useMembers();
  const update = useUpdateRecord(record.id);
  const initialMode = record.lineLabel ? "other" : "line";
  const [body, setBody] = useState(record.body);
  const [when, setWhen] = useState(toLocalInput(record.occurredAt));
  const [memberId, setMemberId] = useState(record.memberId ?? "");
  const [mode, setMode] = useState<"line" | "other">(initialMode);
  const [lineId, setLineId] = useState(record.lineId ?? "");
  const [lineLabel, setLineLabel] = useState(record.lineLabel ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      body,
      occurredAt: fromLocalInput(when),
      memberId: memberId || null,
      lineId: mode === "line" ? lineId || null : null,
      lineLabel: mode === "other" ? lineLabel || null : null,
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
          <SelectInput value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="">Não sei</option>
            {members.data?.map((member) => (
              <option key={member.id} value={member.id}>
                {memberOptionLabel(member)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={mode === "line"}
            onClick={() => setMode("line")}
            className={`rounded-control border px-3 py-3 text-sm font-medium transition ${mode === "line" ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-chip"}`}
          >
            Linha cadastrada
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
        {mode === "line" ? (
          <Field label="Linha">
            <SelectInput value={lineId} onChange={(event) => setLineId(event.target.value)}>
              <option value="">Escolha</option>
              {lines.data?.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : (
          <Field label="Outra">
            <TextInput
              value={lineLabel}
              placeholder="Descreva o equipamento"
              onChange={(event) => setLineLabel(event.target.value)}
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
