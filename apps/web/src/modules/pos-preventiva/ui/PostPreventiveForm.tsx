import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { PostPreventiveDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, MultiSelect, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useLines, useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { MachineFields } from "../../cadastro/ui/MachineFields";
import { flattenRp, useRpPages } from "../../rp/data/rp";
import { formatRpDay } from "../../rp/model/rp";
import { useSavePostPreventive } from "../data/post-preventives";
import { missingFieldsNotice } from "../model/missing-fields";
import { bodyFromValues, formChanged, type PostPreventiveFormValues } from "../model/post-preventive";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-sm font-semibold text-app">{title}</legend>
      {children}
    </fieldset>
  );
}

export function PostPreventiveForm({
  id,
  initial,
  onSaved,
  onDirtyChange,
  notice,
  extraActions,
}: {
  id?: string;
  initial: PostPreventiveFormValues;
  onSaved: (item: PostPreventiveDto) => void;
  // Avisa a tela quando passa a ter (ou deixa de ter) mudança não gravada.
  onDirtyChange?: (dirty: boolean) => void;
  // Aviso da tela que usa o formulário, mostrado junto dos outros, em cima dos botões.
  notice?: string | null;
  extraActions?: ReactNode;
}) {
  const lines = useLines();
  const members = useMembers();
  const save = useSavePostPreventive(id);
  const [values, setValues] = useState(initial);
  const [lastSaved, setLastSaved] = useState(initial);
  const dirty = formChanged(lastSaved, values);
  const [saved, setSaved] = useState(false);
  const [missing, setMissing] = useState<string | null>(null);
  const rpSearch = new URLSearchParams(values.lineId ? { lineId: values.lineId } : {});
  const rps = useRpPages(rpSearch);
  const rpItems = values.lineId ? flattenRp(rps.data?.pages) : [];

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  function set<K extends keyof PostPreventiveFormValues>(key: K, value: PostPreventiveFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function pickLine(lineId: string) {
    setValues((current) => ({ ...current, lineId, machineId: "", subassemblyId: "", rpId: "" }));
    setSaved(false);
  }

  function pickMachine(machineId: string) {
    setValues((current) => ({ ...current, machineId, subassemblyId: "" }));
    setSaved(false);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const notice = missingFieldsNotice(values);
    setMissing(notice);
    if (notice) return;
    save.mutate(bodyFromValues(values), {
      onSuccess: (item) => {
        setSaved(true);
        setLastSaved(values);
        onSaved(item);
      },
    });
  }

  return (
    <Card>
      <form className="flex flex-col gap-6" noValidate onSubmit={submit}>
        <Section title="Onde e quando">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data da preventiva">
              <TextInput type="date" value={values.preventiveDate} onChange={(event) => set("preventiveDate", event.target.value)} />
            </Field>
            <Field label="Data da ocorrência">
              <TextInput type="date" value={values.occurrenceDate} onChange={(event) => set("occurrenceDate", event.target.value)} />
            </Field>
            <Field label="Linha">
              <SelectInput value={values.lineId} onChange={(event) => pickLine(event.target.value)}>
                <option value="">Escolha a linha</option>
                {lines.data?.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <MachineFields
            lineId={values.lineId}
            machineId={values.machineId}
            subassemblyId={values.subassemblyId}
            savedSubassemblyId={initial.subassemblyId}
            onMachineChange={pickMachine}
            onSubassemblyChange={(subassemblyId) => set("subassemblyId", subassemblyId)}
          />
        </Section>

        <Section title="Preventiva e ocorrência">
          <Field label="O que foi feito na preventiva?">
            <TextArea value={values.done} placeholder="Troca das válvulas roletes pelas revisadas" onChange={(event) => set("done", event.target.value)} />
          </Field>
          <Field label="Qual foi a ocorrência depois da liberação?">
            <TextArea value={values.occurrence} placeholder="Quebra do cilindro" onChange={(event) => set("occurrence", event.target.value)} />
          </Field>
          <Field label="Ação preventiva (para não repetir)">
            <TextArea value={values.preventiveAction} onChange={(event) => set("preventiveAction", event.target.value)} />
          </Field>
        </Section>

        <Section title="Ponto de atenção para a próxima preventiva">
          <Field label="Ponto de atenção">
            <TextArea value={values.attentionPoint} onChange={(event) => set("attentionPoint", event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-app">
            <input type="checkbox" checked={values.attentionActive} onChange={(event) => set("attentionActive", event.target.checked)} />
            Ponto ativo (sai na folha do técnico)
          </label>
        </Section>

        <Section title="Técnicos da preventiva">
          <MultiSelect
            label="Técnicos"
            placeholder="Selecione os técnicos"
            emptyText="Nenhum colaborador cadastrado."
            options={(members.data ?? []).map((member) => ({ value: member.id, label: memberOptionLabel(member) }))}
            value={values.memberIds}
            onChange={(memberIds) => set("memberIds", memberIds)}
          />
        </Section>

        <Section title="RP ligado (opcional)">
          <Field label="RP da linha">
            <SelectInput value={values.rpId} disabled={!values.lineId} onChange={(event) => set("rpId", event.target.value)}>
              <option value="">Nenhum</option>
              {values.rpId && !rpItems.some((rp) => rp.id === values.rpId) ? <option value={values.rpId}>RP ligado (fora da lista recente)</option> : null}
              {rpItems.map((rp) => (
                <option key={rp.id} value={rp.id}>
                  {formatRpDay(rp.occurredAt)} · {rp.problem.length > 70 ? `${rp.problem.slice(0, 70)}…` : rp.problem}
                </option>
              ))}
            </SelectInput>
          </Field>
          {values.rpId ? (
            <Link to={`/rp/${values.rpId}`} className="self-start text-sm font-semibold text-accent hover:underline">
              Abrir o RP
            </Link>
          ) : null}
        </Section>

        {missing ? <Notice>{missing}</Notice> : null}
        {notice ? <Notice>{notice}</Notice> : null}
        {!missing && save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        {saved && id ? <p className="text-sm font-medium text-accent">Ficha gravada.</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Gravando…" : "Gravar ficha"}
          </Button>
          {extraActions}
        </div>
      </form>
    </Card>
  );
}
