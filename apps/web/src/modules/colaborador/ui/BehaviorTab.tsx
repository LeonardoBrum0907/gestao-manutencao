import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  BEHAVIOR_RATING_LABELS,
  BEHAVIOR_RATINGS,
  BEHAVIOR_TAG_GROUPS,
  PRODUCTIVITY_LEVEL_LABELS,
  PRODUCTIVITY_LEVELS,
  type BehaviorRating,
  type BehaviorTagDto,
  type FeedbackTone,
  type MemberBehaviorDto,
  type MemberDto,
  type ProductivityLevel,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, MultiSelect, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { flattenPages, useCaptureRecord } from "../../registro/data/records";
import { formatWhen, fromLocalInput, nowLocalInput, toneChipClass, toneLabel, toneOptions } from "../../registro/model/record";
import { useBehaviorTags } from "../../cadastro/data/behavior-tags";
import { useBehavior, useSaveBehavior, type BehaviorWrite } from "../data/behavior";
import { behaviorTagChoices, replaceGroupTags } from "../model/behavior-tags";
import { useMemberRecordList, useMemberRecordSummary } from "../data/member-records";

function writable({ punctuality, productivity, collaboration, tags }: MemberBehaviorDto): BehaviorWrite {
  return { punctuality, productivity, collaboration, tags };
}

function Ratings({ behavior, onChange, disabled }: { behavior: MemberBehaviorDto; onChange: (next: BehaviorWrite) => void; disabled: boolean }) {
  const current = writable(behavior);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Pontualidade">
        <SelectInput
          value={current.punctuality ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...current, punctuality: (event.target.value || null) as BehaviorRating | null })}
        >
          <option value="">—</option>
          {BEHAVIOR_RATINGS.map((value) => (
            <option key={value} value={value}>
              {BEHAVIOR_RATING_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Produtividade">
        <SelectInput
          value={current.productivity ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...current, productivity: (event.target.value || null) as ProductivityLevel | null })}
        >
          <option value="">—</option>
          {PRODUCTIVITY_LEVELS.map((value) => (
            <option key={value} value={value}>
              {PRODUCTIVITY_LEVEL_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Colaboração">
        <SelectInput
          value={current.collaboration ?? ""}
          disabled={disabled}
          onChange={(event) => onChange({ ...current, collaboration: (event.target.value || null) as BehaviorRating | null })}
        >
          <option value="">—</option>
          {BEHAVIOR_RATINGS.map((value) => (
            <option key={value} value={value}>
              {BEHAVIOR_RATING_LABELS[value]}
            </option>
          ))}
        </SelectInput>
      </Field>
    </div>
  );
}

function Tags({ behavior, catalog, onChange }: { behavior: MemberBehaviorDto; catalog: BehaviorTagDto[]; onChange: (next: BehaviorWrite) => void }) {
  const current = writable(behavior);
  return (
    <div className="flex flex-col gap-3">
      {/* grid-cols-1 (minmax(0, 1fr)): sem ele, no celular a coluna cresce com as etiquetas em vez de virar "+N". */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BEHAVIOR_TAG_GROUPS.map((group) => {
          const options = behaviorTagChoices(catalog, group.key, current.tags);
          const groupIds = options.map((option) => option.value);
          return (
            <MultiSelect
              key={group.key}
              label={group.label}
              options={options}
              value={current.tags.filter((tag) => groupIds.includes(tag))}
              onChange={(next) => onChange({ ...current, tags: replaceGroupTags(current.tags, groupIds, next) })}
              placeholder="Nenhum"
              emptyText="Nenhuma opção cadastrada."
              actions={false}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted">
        As opções se ajustam em{" "}
        <Link to="/configuracoes/avaliacao" className="font-medium text-accent hover:underline">
          Configurações › Avaliação
        </Link>
        .
      </p>
    </div>
  );
}

function NewObservation({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const capture = useCaptureRecord();
  const [tone, setTone] = useState<FeedbackTone>("positive");
  const [when, setWhen] = useState(nowLocalInput());
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    capture.mutate(
      { type: "feedback", body, occurredAt: fromLocalInput(when), memberId, tone },
      { onSuccess: onDone },
    );
  }

  return (
    <form className="flex flex-col gap-3 border-t border-t-line px-4 py-4" noValidate onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tom">
          <SelectInput value={tone} onChange={(event) => setTone(event.target.value as FeedbackTone)}>
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Quando">
          <TextInput type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </Field>
      </div>
      <Field label="Observação">
        <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      {capture.isError ? <Notice>{errorMessage(capture.error)}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={capture.isPending}>
          Gravar observação
        </Button>
        <Button tone="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function History({ member }: { member: MemberDto }) {
  const records = useMemberRecordList(member.id, "feedback");
  const summary = useMemberRecordSummary(member.id);
  const [adding, setAdding] = useState(false);
  const feedbacks = flattenPages(records.data?.pages);
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-app">
          Histórico de observações <span className="font-normal text-muted">({summary.data?.feedbacks ?? feedbacks.length})</span>
        </h2>
        {!adding ? (
          <Button tone="ghost" className="px-3 py-1.5" onClick={() => setAdding(true)}>
            + Observação
          </Button>
        ) : null}
      </div>
      {adding ? <NewObservation memberId={member.id} onDone={() => setAdding(false)} /> : null}
      {records.isError ? <Notice>{errorMessage(records.error)}</Notice> : null}
      {records.isSuccess && feedbacks.length === 0 && !adding ? (
        <p className="border-t border-t-line px-4 py-3 text-sm text-muted">
          Nenhuma observação ainda. Os feedbacks registrados com {member.name} como alvo aparecem aqui.
        </p>
      ) : null}
      <ul>
        {feedbacks.map((record) => (
          <li key={record.id} className="border-t border-t-line px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className={toneChipClass(record.tone)}>{record.tone ? toneLabel(record.tone) : "Sem tom"}</span>
              <span>{formatWhen(record.occurredAt)}</span>
              <Link to={`/registros/${record.id}`} className="ml-auto font-medium text-accent hover:underline">
                Abrir
              </Link>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-app">{record.body}</p>
          </li>
        ))}
      </ul>
      {records.hasNextPage ? (
        <div className="flex justify-center border-t border-t-line px-4 py-3">
          <Button tone="ghost" onClick={() => void records.fetchNextPage()} disabled={records.isFetchingNextPage}>
            {records.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function BehaviorTab({ member }: { member: MemberDto }) {
  const behavior = useBehavior(member.id);
  const save = useSaveBehavior(member.id);
  const tags = useBehaviorTags();
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-sm font-semibold text-app">Avaliação</h2>
        <p className="mt-1 text-sm text-muted">Grava ao escolher.</p>
        {behavior.isPending || tags.isPending ? <p className="mt-3 text-sm text-muted">Carregando…</p> : null}
        {behavior.isError || tags.isError ? <Notice>{errorMessage(behavior.error ?? tags.error)}</Notice> : null}
        {behavior.data && tags.data ? (
          <div className="mt-4 flex flex-col gap-6">
            <Ratings behavior={behavior.data} onChange={(next) => save.mutate(next)} disabled={save.isPending} />
            <Tags behavior={behavior.data} catalog={tags.data} onChange={(next) => save.mutate(next)} />
          </div>
        ) : null}
        {save.isError ? (
          <div className="mt-3">
            <Notice>{errorMessage(save.error)}</Notice>
          </div>
        ) : null}
      </Card>
      <History member={member} />
    </div>
  );
}
