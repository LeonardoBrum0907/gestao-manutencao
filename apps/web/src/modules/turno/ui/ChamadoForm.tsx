import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RecordDto, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useLines, useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { fromLocalInput, statusOptions, toLocalInput } from "../../registro/model/record";
import { useSaveChamado } from "../data/shift";

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function localOrNull(value: string): string | null {
  return value ? fromLocalInput(value) : null;
}

function intOrNull(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  return Number(text);
}

export function ChamadoForm({ record }: { record?: RecordDto }) {
  const navigate = useNavigate();
  const lines = useLines();
  const members = useMembers();
  const save = useSaveChamado(record?.id);
  const [dayNumber, setDayNumber] = useState(record?.dayNumber ? String(record.dayNumber) : "");
  const [body, setBody] = useState(record?.body ?? "");
  const [openedAt, setOpenedAt] = useState(record?.openedAt ? toLocalInput(record.openedAt) : "");
  const [closedAt, setClosedAt] = useState(record?.closedAt ? toLocalInput(record.closedAt) : "");
  const [durationMin, setDurationMin] = useState(record?.durationMin === null || record?.durationMin === undefined ? "" : String(record.durationMin));
  const [memberIds, setMemberIds] = useState<string[]>(record?.memberIds ?? []);
  const [mode, setMode] = useState<"line" | "other">(record?.lineLabel ? "other" : "line");
  const [lineId, setLineId] = useState(record?.lineId ?? "");
  const [lineLabel, setLineLabel] = useState(record?.lineLabel ?? "");
  const [status, setStatus] = useState<RecordStatus>(record?.status ?? "open");
  const [notes, setNotes] = useState(record?.notes ?? "");

  function toggleMember(id: string) {
    setMemberIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate(
      {
        dayNumber: Number(dayNumber),
        body,
        openedAt: localOrNull(openedAt),
        closedAt: localOrNull(closedAt),
        durationMin: intOrNull(durationMin),
        memberIds,
        lineId: mode === "line" ? blank(lineId) : null,
        lineLabel: mode === "other" ? blank(lineLabel) : null,
        status,
        notes: blank(notes),
      },
      { onSuccess: (saved) => {
        if (!record) navigate(`/registros/${saved.id}`);
      } },
    );
  }

  return (
    <Card>
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <Field label="Nº do dia">
          <TextInput type="number" min={1} value={dayNumber} onChange={(event) => setDayNumber(event.target.value)} />
        </Field>
        <Field label="Descrição">
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Abertura">
            <TextInput type="datetime-local" value={openedAt} onChange={(event) => setOpenedAt(event.target.value)} />
          </Field>
          <Field label="Fechamento">
            <TextInput type="datetime-local" value={closedAt} onChange={(event) => setClosedAt(event.target.value)} />
          </Field>
        </div>
        <Field label="Duração (minutos)">
          <TextInput
            type="number"
            min={0}
            value={durationMin}
            placeholder="Calculada pela abertura e o fechamento, se vazia"
            onChange={(event) => setDurationMin(event.target.value)}
          />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-app">Técnicos</legend>
          <div className="flex max-h-40 flex-col gap-2 overflow-y-auto rounded-control border border-line bg-surface p-3">
            {members.data?.length ? (
              members.data.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-app">
                  <input
                    type="checkbox"
                    checked={memberIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                  />
                  {memberOptionLabel(member)}
                </label>
              ))
            ) : (
              <p className="text-sm text-muted">Nenhum técnico cadastrado.</p>
            )}
          </div>
        </fieldset>
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
              <option value="">Sem linha</option>
              {lines.data?.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : (
          <Field label="Outra">
            <TextInput value={lineLabel} placeholder="Descreva o equipamento" onChange={(event) => setLineLabel(event.target.value)} />
          </Field>
        )}
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
        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        {record && save.isSuccess ? <p className="text-sm font-medium text-accent">Chamado gravado.</p> : null}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Gravando…" : record ? "Gravar chamado" : "Abrir chamado"}
        </Button>
      </form>
    </Card>
  );
}
