import { useState, type FormEvent } from "react";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useFactories } from "../../cadastro/data/cadastro";
import { useSaveOcorrencia } from "../data/shift";

// Só para as ocorrências antigas: a tela de criar saiu do menu (anotar rápido é Registrar; análise é o RP).
export function OcorrenciaForm({ record }: { record: RecordDto }) {
  const factories = useFactories();
  const save = useSaveOcorrencia(record.id);
  const [factoryId, setFactoryId] = useState(record.factoryId ?? "");
  const [line, setLine] = useState(record.line ?? "");
  const [body, setBody] = useState(record.body ?? "");

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ factoryId, line, body });
  }

  return (
    <Card>
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <Field label="Fábrica">
          <SelectInput value={factoryId} onChange={(event) => setFactoryId(event.target.value)}>
            <option value="">Escolha</option>
            {factories.data?.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Linha">
          <TextInput value={line} onChange={(event) => setLine(event.target.value)} />
        </Field>
        <Field label="Texto">
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        {save.isSuccess ? <p className="text-sm font-medium text-accent">Ocorrência gravada.</p> : null}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Gravando…" : "Gravar ocorrência"}
        </Button>
      </form>
    </Card>
  );
}
