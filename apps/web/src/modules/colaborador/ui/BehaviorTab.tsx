import { Link } from "react-router-dom";
import {
  BEHAVIOR_RATING_LABELS,
  BEHAVIOR_RATINGS,
  BEHAVIOR_TAG_GROUPS,
  PRODUCTIVITY_LEVEL_LABELS,
  PRODUCTIVITY_LEVELS,
  type BehaviorRating,
  type BehaviorTagDto,
  type MemberBehaviorDto,
  type MemberDto,
  type ProductivityLevel,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, MultiSelect, Notice, SelectInput } from "../../../design/ui/controls";
import { useBehaviorTags } from "../../cadastro/data/behavior-tags";
import { useBehavior, useSaveBehavior, type BehaviorWrite } from "../data/behavior";
import { behaviorTagChoices, replaceGroupTags } from "../model/behavior-tags";
import { MemberFeedbackCard, MemberObservationCard } from "./member-notes-cards";

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
      <MemberFeedbackCard member={member} />
      <MemberObservationCard member={member} />
    </div>
  );
}
