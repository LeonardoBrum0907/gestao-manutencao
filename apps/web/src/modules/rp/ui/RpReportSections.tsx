import type { ReactNode } from "react";
import { RP_FOUR_M, RP_FOUR_M_LABELS, type RpFourM } from "@manutencao/shared";
import { Field, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { rpStatusOptions, type RpFormValues } from "../model/rp";
import { BasicConditionChoice } from "./BasicConditionChoice";

/**
 * Bloco do formulário com título, separado do anterior por uma linha.
 * @example <Section title="Problema">…</Section>
 */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-sm font-semibold text-app">{title}</legend>
      {children}
    </fieldset>
  );
}

// Erro de cada campo, para aparecer logo abaixo dele (a página pública confere antes de mandar).
export type RpFieldErrors = Partial<Record<keyof RpFormValues, string>>;

export type RpReportSectionsProps = {
  values: RpFormValues;
  errors?: RpFieldErrors;
  // O que ocorreu e o status o RP sempre exige; a página pública exige também o resto (ver RP_REQUIRED_FIELDS).
  required?: ReadonlySet<keyof RpFormValues>;
  set: <K extends keyof RpFormValues>(key: K, value: RpFormValues[K]) => void;
  setCause: (key: RpFourM, patch: Partial<RpFormValues["causes"][RpFourM]>) => void;
};

/**
 * O miolo do RP, igual no app e na página pública: problema, 4M, causa e contramedidas, status.
 * @example <RpReportSections values={values} set={set} setCause={setCause} />
 */
export function RpReportSections({ values, set, setCause, errors = {}, required = new Set() }: RpReportSectionsProps) {
  return (
    <>
      <Section title="Problema">
        <Field label="O que ocorreu?" required error={errors.problem}>
          <TextArea value={values.problem} onChange={(event) => set("problem", event.target.value)} />
        </Field>
        <Field label="O que foi observado?" required={required.has("description")} error={errors.description}>
          <TextArea value={values.description} onChange={(event) => set("description", event.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-app">
          <input type="checkbox" checked={values.repeatedFailure} onChange={(event) => set("repeatedFailure", event.target.checked)} />
          Falha repetida
        </label>
        {values.repeatedFailure ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantas vezes?" error={errors.repeatedTimes}>
              <TextInput value={values.repeatedTimes} onChange={(event) => set("repeatedTimes", event.target.value)} />
            </Field>
            <Field label="Período aproximado" error={errors.repeatedPeriod}>
              <TextInput value={values.repeatedPeriod} onChange={(event) => set("repeatedPeriod", event.target.value)} />
            </Field>
          </div>
        ) : null}
      </Section>

      <Section title="4M: possíveis causas">
        <div className="flex flex-col gap-3">
          {RP_FOUR_M.map((key) => (
            <div key={key} className="grid items-center gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <label className="flex items-center gap-2 text-sm font-medium text-app">
                <input type="checkbox" checked={values.causes[key].marked} onChange={(event) => setCause(key, { marked: event.target.checked })} />
                {RP_FOUR_M_LABELS[key]}
              </label>
              <TextInput
                aria-label={`Texto de ${RP_FOUR_M_LABELS[key]}`}
                value={values.causes[key].text}
                onChange={(event) => setCause(key, { text: event.target.value })}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Causa e contramedidas">
        <Field label="Causa raiz (por que aconteceu?)" required={required.has("rootCause")} error={errors.rootCause}>
          <TextArea value={values.rootCause} onChange={(event) => set("rootCause", event.target.value)} />
        </Field>
        <Field label="Contramedida corretiva (o que foi feito agora?)" required={required.has("corrective")} error={errors.corrective}>
          <TextArea value={values.corrective} onChange={(event) => set("corrective", event.target.value)} />
        </Field>
        <Field label="Contramedida preventiva (como evitar repetir?)" required={required.has("preventive")} error={errors.preventive}>
          <TextArea value={values.preventive} onChange={(event) => set("preventive", event.target.value)} />
        </Field>
      </Section>

      <Section title="Fechamento">
        <Field label="Status" required error={errors.status}>
          <SelectInput value={values.status} onChange={(event) => set("status", event.target.value as RpFormValues["status"])}>
            {rpStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <BasicConditionChoice
          value={values.basicConditionImpact}
          onChange={(next) => set("basicConditionImpact", next)}
          required={required.has("basicConditionImpact")}
          error={errors.basicConditionImpact}
        />
      </Section>
    </>
  );
}
