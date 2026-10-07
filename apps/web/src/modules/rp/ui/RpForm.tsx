import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { RP_FOUR_M, RP_FOUR_M_LABELS, type RpDuplicateDto, type RpFourM } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useFactories, useLines, useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { useCheckDuplicate, useSaveRp } from "../data/rp";
import { bodyFromValues, formatRpDay, rpStatusOptions, type RpFormValues } from "../model/rp";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-1 text-sm font-semibold text-app">{title}</legend>
      {children}
    </fieldset>
  );
}

function DuplicateNotice({ items, onConfirm, busy }: { items: RpDuplicateDto[]; onConfirm: () => void; busy: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // O botão de salvar fica no fim do formulário: leva o aviso para a tela.
  useEffect(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }), []);
  return (
    <div ref={ref} role="alert" className="flex flex-col gap-3 rounded-control border border-accent bg-accent-soft p-4 text-sm text-app">
      <p className="font-semibold">Já existe RP parecido. Confira antes de salvar.</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/rp/${item.id}`} target="_blank" className="font-medium text-accent hover:underline">
              {formatRpDay(item.occurredAt)} · {[item.line, item.tag].filter(Boolean).join(" · ") || "sem linha"}
            </Link>{" "}
            <span className="text-muted">
              {item.reason === "order" ? "(mesma ordem)" : "(mesmo problema, no mesmo dia e lugar)"}: {item.problem}
            </span>
          </li>
        ))}
      </ul>
      <div>
        <Button tone="ghost" onClick={onConfirm} disabled={busy}>
          Salvar mesmo assim
        </Button>
      </div>
    </div>
  );
}

export function RpForm({
  id,
  initial,
  rawText,
  warnings = [],
  submitLabel,
  onSaved,
  onSkip,
  extraActions,
}: {
  id?: string;
  initial: RpFormValues;
  rawText: string;
  warnings?: string[];
  submitLabel: string;
  onSaved: () => void;
  onSkip?: () => void;
  extraActions?: ReactNode;
}) {
  const factories = useFactories();
  const lines = useLines();
  const members = useMembers();
  const save = useSaveRp(id);
  const check = useCheckDuplicate();
  const [values, setValues] = useState(initial);
  const [duplicates, setDuplicates] = useState<RpDuplicateDto[]>([]);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof RpFormValues>(key: K, value: RpFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setDuplicates([]);
    setSaved(false);
  }

  function setCause(key: RpFourM, patch: Partial<RpFormValues["causes"][RpFourM]>) {
    set("causes", { ...values.causes, [key]: { ...values.causes[key], ...patch } });
  }

  function pickLine(lineId: string) {
    const line = lines.data?.find((item) => item.id === lineId);
    setValues((current) => ({ ...current, lineId, factoryId: line ? line.factoryId : current.factoryId }));
    setDuplicates([]);
  }

  function toggleMember(memberId: string) {
    set("memberIds", values.memberIds.includes(memberId) ? values.memberIds.filter((item) => item !== memberId) : [...values.memberIds, memberId]);
  }

  function persist() {
    save.mutate(bodyFromValues(values, rawText), {
      onSuccess: () => {
        setSaved(true);
        onSaved();
      },
    });
  }

  // Ao chegar do texto colado já confere se o relatório existe; só RP novo precisa disso.
  useEffect(() => {
    if (id || !initial.problem.trim() || !initial.factoryId) return;
    check.mutate(bodyFromValues(initial, rawText), { onSuccess: setDuplicates });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (id) {
      persist();
      return;
    }
    try {
      const found = await check.mutateAsync(bodyFromValues(values, rawText));
      if (found.length) {
        setDuplicates(found);
        return;
      }
    } catch {
      // A conferência é um aviso: se falhar, a gravação mostra o erro de verdade.
    }
    persist();
  }

  const busy = save.isPending || check.isPending;
  const unmatched = values.unmatchedTechnicians.trim();

  return (
    <Card>
      <form className="flex flex-col gap-6" noValidate onSubmit={(event) => void submit(event)}>
        {warnings.length ? (
          <ul className="flex flex-col gap-1 rounded-control bg-chip p-3 text-sm text-app">
            {warnings.map((warning) => (
              <li key={warning}>⚠ {warning}</li>
            ))}
          </ul>
        ) : null}
        {duplicates.length ? <DuplicateNotice items={duplicates} onConfirm={persist} busy={busy} /> : null}

        <Section title="Identificação">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <TextInput type="date" value={values.occurredAt} onChange={(event) => set("occurredAt", event.target.value)} />
            </Field>
            <Field label="Ordem">
              <TextInput value={values.orderNumber} onChange={(event) => set("orderNumber", event.target.value)} />
            </Field>
            <Field label="Linha cadastrada">
              <SelectInput value={values.lineId} onChange={(event) => pickLine(event.target.value)}>
                <option value="">Sem cadastro (só linha e TAG do texto)</option>
                {lines.data?.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                    {line.internalCode ? ` · ${line.internalCode}` : ""}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Fábrica">
              <SelectInput value={values.factoryId} onChange={(event) => set("factoryId", event.target.value)}>
                <option value="">Escolha a fábrica</option>
                {factories.data?.map((factory) => (
                  <option key={factory.id} value={factory.id}>
                    {factory.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Linha do texto">
              <TextInput value={values.line} onChange={(event) => set("line", event.target.value)} />
            </Field>
            <Field label="TAG">
              <TextInput value={values.tag} onChange={(event) => set("tag", event.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Problema">
          <Field label="O que ocorreu?">
            <TextArea value={values.problem} onChange={(event) => set("problem", event.target.value)} />
          </Field>
          <Field label="O que foi observado?">
            <TextArea value={values.description} onChange={(event) => set("description", event.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-app">
            <input type="checkbox" checked={values.repeatedFailure} onChange={(event) => set("repeatedFailure", event.target.checked)} />
            Falha repetida
          </label>
          {values.repeatedFailure ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantas vezes?">
                <TextInput value={values.repeatedTimes} onChange={(event) => set("repeatedTimes", event.target.value)} />
              </Field>
              <Field label="Período aproximado">
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
          <Field label="Causa raiz (por que aconteceu?)">
            <TextArea value={values.rootCause} onChange={(event) => set("rootCause", event.target.value)} />
          </Field>
          <Field label="Contramedida corretiva (o que foi feito agora?)">
            <TextArea value={values.corrective} onChange={(event) => set("corrective", event.target.value)} />
          </Field>
          <Field label="Contramedida preventiva (como evitar repetir?)">
            <TextArea value={values.preventive} onChange={(event) => set("preventive", event.target.value)} />
          </Field>
        </Section>

        <Section title="Fechamento">
          <Field label="Status">
            <SelectInput value={values.status} onChange={(event) => set("status", event.target.value as RpFormValues["status"])}>
              {rpStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Impacto em condição básica">
            <TextArea value={values.basicConditionImpact} onChange={(event) => set("basicConditionImpact", event.target.value)} />
          </Field>
        </Section>

        <Section title="Técnicos">
          <div className="flex max-h-44 flex-col gap-2 overflow-y-auto rounded-control border border-line bg-surface p-3">
            {members.data?.length ? (
              members.data.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-app">
                  <input type="checkbox" checked={values.memberIds.includes(member.id)} onChange={() => toggleMember(member.id)} />
                  {memberOptionLabel(member)}
                </label>
              ))
            ) : (
              <p className="text-sm text-muted">Nenhum colaborador cadastrado.</p>
            )}
          </div>
          <Field label={unmatched ? "Não encontrados no cadastro (texto do relatório)" : "Outros nomes (fora do cadastro)"}>
            <TextInput value={values.unmatchedTechnicians} onChange={(event) => set("unmatchedTechnicians", event.target.value)} />
          </Field>
        </Section>

        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        {saved && id ? <p className="text-sm font-medium text-accent">RP gravado.</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Gravando…" : submitLabel}
          </Button>
          {onSkip ? (
            <Button tone="ghost" onClick={onSkip} disabled={busy}>
              Pular este
            </Button>
          ) : null}
          {extraActions}
        </div>
      </form>
    </Card>
  );
}
