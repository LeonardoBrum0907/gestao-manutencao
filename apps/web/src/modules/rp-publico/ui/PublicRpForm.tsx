import { useState, type FormEvent } from "react";
import type { PublicRpDirectoryDto, PublicRpDto, RpFourM } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, MultiSelect, Notice, SelectInput, TextInput } from "../../../design/ui/controls";
import type { RpFormValues } from "../../rp/model/rp";
import { RpReportSections, Section } from "../../rp/ui/RpReportSections";
import { useSavePublicRp } from "../data/public-rp";
import { memberChoices, publicBodyFromValues, withLine, withMachine } from "../model/public-rp";
import { ReviewRequestNotice } from "./public-rp-parts";

type Setter = <K extends keyof RpFormValues>(key: K, value: RpFormValues[K]) => void;

function PlaceSection({ values, set, update, directory }: { values: RpFormValues; set: Setter; update: (next: RpFormValues) => void; directory: PublicRpDirectoryDto }) {
  const lines = directory.lines.filter((line) => !values.factoryId || line.factoryId === values.factoryId);
  const machines = directory.machines.filter((machine) => machine.lineId === values.lineId);
  return (
    <Section title="Identificação">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data">
          <TextInput type="date" value={values.occurredAt} onChange={(event) => set("occurredAt", event.target.value)} />
        </Field>
        <Field label="Ordem">
          <TextInput value={values.orderNumber} onChange={(event) => set("orderNumber", event.target.value)} />
        </Field>
        <Field label="Fábrica">
          <SelectInput value={values.factoryId} onChange={(event) => update({ ...values, factoryId: event.target.value, lineId: "", machineId: "" })}>
            <option value="">Escolha a fábrica</option>
            {directory.factories.map((factory) => (
              <option key={factory.id} value={factory.id}>
                {factory.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Linha">
          <SelectInput value={values.lineId} onChange={(event) => update(withLine(values, event.target.value, directory.lines))}>
            <option value="">Outra linha (escrever)</option>
            {lines.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
                {line.internalCode ? ` · ${line.internalCode}` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
        {values.lineId ? null : (
          <Field label="Nome da linha">
            <TextInput value={values.line} onChange={(event) => set("line", event.target.value)} />
          </Field>
        )}
        {values.lineId ? (
          <Field label="Máquina">
            <SelectInput value={values.machineId} onChange={(event) => update(withMachine(values, event.target.value, directory.machines))}>
              <option value="">{machines.length ? "Não sei" : "Nenhuma máquina nesta linha"}</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                  {machine.tag ? ` · ${machine.tag}` : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
        <Field label="TAG">
          <TextInput value={values.tag} onChange={(event) => set("tag", event.target.value)} />
        </Field>
      </div>
    </Section>
  );
}

/**
 * Formulário do RP na página pública, na ordem do texto do WhatsApp. Técnicos: só os liberados pelo coordenador.
 * @example <PublicRpForm code={code} directory={directory} initial={newPublicValues(memberId)} onSaved={abrir} />
 */
export function PublicRpForm({
  code,
  directory,
  initial,
  current = null,
  onSaved,
}: {
  code: string;
  directory: PublicRpDirectoryDto;
  initial: RpFormValues;
  current?: PublicRpDto | null;
  onSaved: (rp: PublicRpDto) => void;
}) {
  const save = useSavePublicRp(code, current?.id);
  const [values, setValues] = useState(initial);
  const [revised, setRevised] = useState(true);
  // Campo-isca: escondido de quem usa a tela; robô que preenche tudo cai aqui.
  const [website, setWebsite] = useState("");

  const set: Setter = (key, value) => setValues((before) => ({ ...before, [key]: value }));
  const setCause = (key: RpFourM, patch: Partial<RpFormValues["causes"][RpFourM]>) =>
    setValues((before) => ({ ...before, causes: { ...before.causes, [key]: { ...before.causes[key], ...patch } } }));

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate(publicBodyFromValues(values, { revised: Boolean(current?.reviewRequest) && revised, website }), { onSuccess: onSaved });
  }

  return (
    <Card>
      <form className="flex flex-col gap-6" noValidate onSubmit={submit}>
        {current?.reviewRequest ? (
          <ReviewRequestNotice text={current.reviewRequest} at={current.reviewRequestedAt}>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={revised} onChange={(event) => setRevised(event.target.checked)} />
              Revisado: corrigi o que foi pedido
            </label>
          </ReviewRequestNotice>
        ) : null}
        <PlaceSection values={values} set={set} update={setValues} directory={directory} />
        <RpReportSections values={values} set={set} setCause={setCause} />
        <Section title="Técnico">
          <MultiSelect
            label="Técnicos"
            placeholder="Selecione quem atendeu"
            emptyText="O coordenador ainda não liberou técnicos para esta página."
            options={memberChoices(directory.members, current)}
            value={values.memberIds}
            onChange={(memberIds) => set("memberIds", memberIds)}
          />
        </Section>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        <div>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Gravando…" : current ? "Gravar alterações" : "Gravar relatório"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
