import { useRef, useState, type FormEvent } from "react";
import type { PublicRpDirectoryDto, PublicRpDto, RpFourM } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, MultiSelect, Notice, SelectInput, TextInput } from "../../../design/ui/controls";
import { revealFirstInvalid } from "../../../design/ui/field-feedback";
import type { RpFormValues } from "../../rp/model/rp";
import { RpReportSections, Section, type RpFieldErrors } from "../../rp/ui/RpReportSections";
import { useSavePublicRp } from "../data/public-rp";
import { memberChoices, publicBodyFromValues, withLine, withMachine } from "../model/public-rp";
import { publicRpFormErrors } from "../model/public-rp-validation";
import { ReviewRequestNotice } from "./public-rp-parts";

type Setter = <K extends keyof RpFormValues>(key: K, value: RpFormValues[K]) => void;

type PlaceSectionProps = { values: RpFormValues; set: Setter; update: (next: RpFormValues) => void; directory: PublicRpDirectoryDto; errors: RpFieldErrors };

function PlaceSection({ values, set, update, directory, errors }: PlaceSectionProps) {
  const lines = directory.lines.filter((line) => !values.factoryId || line.factoryId === values.factoryId);
  const machines = directory.machines.filter((machine) => machine.lineId === values.lineId);
  return (
    <Section title="Identificação">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" required error={errors.occurredAt}>
          <TextInput type="date" value={values.occurredAt} onChange={(event) => set("occurredAt", event.target.value)} />
        </Field>
        <Field label="Ordem" error={errors.orderNumber}>
          <TextInput value={values.orderNumber} onChange={(event) => set("orderNumber", event.target.value)} />
        </Field>
        <Field label="Fábrica" required error={errors.factoryId}>
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
          <Field label="Nome da linha" error={errors.line}>
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
        <Field label="TAG" error={errors.tag}>
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
  // Os erros só aparecem depois da primeira tentativa de gravar; a partir daí somem conforme a pessoa corrige.
  const [tried, setTried] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errors: RpFieldErrors = tried ? publicRpFormErrors(values) : {};
  const hasErrors = Object.keys(errors).length > 0;

  const set: Setter = (key, value) => setValues((before) => ({ ...before, [key]: value }));
  const setCause = (key: RpFourM, patch: Partial<RpFormValues["causes"][RpFourM]>) =>
    setValues((before) => ({ ...before, causes: { ...before.causes, [key]: { ...before.causes[key], ...patch } } }));

  function submit(event: FormEvent) {
    event.preventDefault();
    setTried(true);
    if (Object.keys(publicRpFormErrors(values)).length) {
      revealFirstInvalid(formRef.current);
      return;
    }
    save.mutate(publicBodyFromValues(values, { revised: Boolean(current?.reviewRequest) && revised, website }), { onSuccess: onSaved });
  }

  return (
    <Card>
      <form ref={formRef} className="flex flex-col gap-6" noValidate onSubmit={submit}>
        <p className="text-sm text-muted">
          Campos com <span className="font-semibold text-danger">*</span> são obrigatórios.
        </p>
        {current?.reviewRequest ? (
          <ReviewRequestNotice text={current.reviewRequest} at={current.reviewRequestedAt}>
            <label className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={revised} onChange={(event) => setRevised(event.target.checked)} />
              Revisado: corrigi o que foi pedido
            </label>
          </ReviewRequestNotice>
        ) : null}
        <PlaceSection values={values} set={set} update={setValues} directory={directory} errors={errors} />
        <RpReportSections values={values} set={set} setCause={setCause} errors={errors} />
        <Section title="Técnico">
          <MultiSelect
            label="Técnicos"
            placeholder="Selecione quem atendeu"
            emptyText="O coordenador ainda não liberou técnicos para esta página."
            options={memberChoices(directory.members, current)}
            value={values.memberIds}
            onChange={(memberIds) => set("memberIds", memberIds)}
            required
            error={errors.memberIds}
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
        {hasErrors ? <Notice>Corrija os campos marcados acima.</Notice> : null}
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
