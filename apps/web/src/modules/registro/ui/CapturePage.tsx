import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { useCaptureRecord } from "../data/records";
import { fromLocalInput, nowLocalInput, typeChoices } from "../model/record";

export function CapturePage() {
  const members = useMembers();
  const capture = useCaptureRecord();
  const navigate = useNavigate();
  const [type, setType] = useState<RecordType>("task");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState(nowLocalInput);
  const [memberId, setMemberId] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    capture.mutate(
      {
        type,
        body,
        occurredAt: fromLocalInput(when),
        memberId: memberId || null,
      },
      { onSuccess: (record) => navigate(`/registros/${record.id}`, { replace: true }) },
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        title="Registrar"
        text="Texto, tipo, quando e quem — se souber. O resto fica para a ficha."
      />
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <div className="grid gap-3">
          {typeChoices.map((choice) => (
            <button
              key={choice.type}
              type="button"
              aria-pressed={type === choice.type}
              onClick={() => setType(choice.type)}
              className={`rounded-card border px-4 py-4 text-left transition ${
                type === choice.type ? "border-accent bg-accent-soft" : "border-line bg-card hover:bg-chip"
              }`}
            >
              <p className="text-base font-semibold">{choice.gestor}</p>
              <p className="mt-1 text-sm text-muted">{choice.short}</p>
            </button>
          ))}
        </div>
        <Card>
          <div className="flex flex-col gap-4">
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
            {capture.isError ? <Notice>{errorMessage(capture.error)}</Notice> : null}
            <Button type="submit" className="w-full" disabled={capture.isPending}>
              {capture.isPending ? "Gravando…" : "Gravar"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
