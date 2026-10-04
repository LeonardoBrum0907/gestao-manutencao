import { useState, type FormEvent } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { useUpdateRecord } from "../data/records";
import { fromLocalInput, toLocalInput } from "../model/record";

export function FeedbackSheet({ record }: { record: RecordDto }) {
  const members = useMembers();
  const update = useUpdateRecord(record.id);
  const [body, setBody] = useState(record.body);
  const [when, setWhen] = useState(toLocalInput(record.occurredAt));
  const [memberId, setMemberId] = useState(record.memberId ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    update.mutate({
      body,
      occurredAt: fromLocalInput(when),
      memberId: memberId || null,
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
          <SelectInput value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="">Ninguém</option>
            {members.data?.map((member) => (
              <option key={member.id} value={member.id}>
                {memberOptionLabel(member)}
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
