import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  COMPETENCY_EQUIPMENTS,
  COMPETENCY_LEVEL_EXPECTED,
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_MATRIX_TITLE,
  COMPETENCY_SCORE_LABELS,
  COMPETENCY_SCORES,
  type CompetencyEntryDto,
  type CompetencyScore,
  type CompetencySkill,
  type CompetencySummaryDto,
  type MemberMatrixDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { useMembers } from "../../cadastro/data/cadastro";
import { positionLabel } from "../../cadastro/model/labels";
import { useMatrix, useSetMatrixEquipments, useSetSkill, type SkillWrite } from "../data/matrix";
import {
  adherenceTone,
  average,
  bySubgroup,
  entriesById,
  equipmentName,
  expectedOf,
  matchesSearch,
  percent,
  skillsOf,
  skillState,
  stateRowClass,
} from "../model/matrix";

function Stat({ label, value, tone = "" }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card compact>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone || "text-app"}`}>{value}</p>
    </Card>
  );
}

function Summary({ summary }: { summary: CompetencySummaryDto }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Stat
        label="Aderência"
        value={percent(summary.adherence)}
        tone={summary.adherence === null ? "text-muted" : summary.adherence >= 80 ? "text-accent" : "text-danger"}
      />
      <Stat label="Atende" value={summary.meets} />
      <Stat label="Abaixo" value={summary.below} tone={summary.below ? "text-danger" : ""} />
      <Stat label="Sem nota" value={summary.unscored} tone="text-muted" />
      <Stat label="Não se aplica" value={summary.notApplicable} tone="text-muted" />
      <Stat label="Média" value={average(summary.average)} />
    </div>
  );
}

function Bar({ value }: { value: number | null }) {
  return (
    <span className="block h-2 w-24 overflow-hidden rounded-full bg-chip" aria-hidden="true">
      <span className={`block h-full ${adherenceTone(value)}`} style={{ width: `${value ?? 0}%` }} />
    </span>
  );
}

const scoreButton =
  "h-9 min-w-9 rounded-control border px-2 text-sm font-semibold tabular-nums transition";

function SkillRow({
  skill,
  entry,
  onChange,
  disabled,
}: {
  skill: CompetencySkill;
  entry: CompetencyEntryDto | undefined;
  onChange: (write: SkillWrite) => void;
  disabled: boolean;
}) {
  const state = skillState(skill, entry);
  const expected = expectedOf(skill, entry);
  const base = {
    skillId: skill.id,
    score: entry?.score ?? null,
    notApplicable: entry?.notApplicable ?? false,
    expected: entry?.expected ?? null,
  };
  return (
    <li
      className={`flex flex-col gap-3 border-l-4 border-t border-t-line bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between ${stateRowClass[state]}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-app">{skill.text}</p>
        <p className="mt-1 text-xs text-muted">
          {COMPETENCY_LEVEL_LABELS[skill.level]} · esperado{" "}
          <select
            aria-label={`Esperado em ${skill.text}`}
            className="rounded-control border border-line bg-surface px-1 py-0.5 text-xs text-app"
            value={entry?.expected ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...base, expected: event.target.value ? (Number(event.target.value) as CompetencyScore) : null })
            }
          >
            <option value="">{COMPETENCY_LEVEL_EXPECTED[skill.level]} (padrão)</option>
            {[1, 2, 3, 4].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </p>
      </div>
      <div role="group" aria-label={`Nota em ${skill.text}`} className="flex shrink-0 flex-wrap gap-1">
        {COMPETENCY_SCORES.map((score) => {
          const pressed = !base.notApplicable && base.score === score;
          return (
            <button
              key={score}
              type="button"
              aria-pressed={pressed}
              title={`${score} · ${COMPETENCY_SCORE_LABELS[score].label}`}
              disabled={disabled}
              onClick={() => onChange({ ...base, notApplicable: false, score: pressed ? null : score })}
              className={`${scoreButton} ${
                pressed
                  ? score >= expected
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-danger bg-danger text-canvas"
                  : "border-line bg-surface text-app hover:bg-chip"
              }`}
            >
              {score}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={base.notApplicable}
          title="Não se aplica"
          disabled={disabled}
          onClick={() => onChange({ ...base, score: null, notApplicable: !base.notApplicable })}
          className={`${scoreButton} ${
            base.notApplicable ? "border-muted bg-chip text-app" : "border-line bg-surface text-muted hover:bg-chip"
          }`}
        >
          N/A
        </button>
      </div>
    </li>
  );
}

function Equipment({
  matrix,
  equipment,
  open,
  onToggle,
  query,
  onChange,
  disabled,
}: {
  matrix: MemberMatrixDto;
  equipment: string;
  open: boolean;
  onToggle: () => void;
  query: string;
  onChange: (write: SkillWrite) => void;
  disabled: boolean;
}) {
  const summary = matrix.byEquipment.find((item) => item.equipment === equipment);
  const entries = entriesById(matrix.entries);
  const skills = skillsOf(equipment).filter((skill) => matchesSearch(skill, query));
  if (query && skills.length === 0) return null;
  const expanded = open || Boolean(query);
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-chip sm:px-5"
      >
        <span className="font-semibold text-app">{equipmentName(equipment)}</span>
        {summary ? (
          <span className="flex items-center gap-3 text-sm text-muted">
            <span className="tabular-nums">
              {summary.meets} de {summary.applicable} atendem
            </span>
            <Bar value={summary.adherence} />
            <span className="w-10 text-right font-semibold tabular-nums text-app">{percent(summary.adherence)}</span>
          </span>
        ) : null}
      </button>
      {expanded ? (
        <div className="border-t border-line">
          {bySubgroup(skills).map((group) => (
            <div key={group.subgroup}>
              <p className="bg-chip px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:px-5">
                {group.subgroup}
              </p>
              <ul>
                {group.skills.map((skill) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    entry={entries.get(skill.id)}
                    onChange={onChange}
                    disabled={disabled}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Matrix({ matrix }: { matrix: MemberMatrixDto }) {
  const setEquipments = useSetMatrixEquipments(matrix.memberId);
  const setSkill = useSetSkill(matrix.memberId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(matrix.equipments[0] ?? null);

  function toggleEquipment(key: string) {
    const next = matrix.equipments.includes(key)
      ? matrix.equipments.filter((item) => item !== key)
      : [...matrix.equipments, key];
    setEquipments.mutate(next);
  }

  const error = setEquipments.error ?? setSkill.error;
  return (
    <div className="flex flex-col gap-6">
      <Summary summary={matrix.summary} />
      <Card>
        <h2 className="text-sm font-semibold text-app">Equipamentos que se aplicam</h2>
        <p className="mt-1 text-sm text-muted">A aderência conta só estes. Quem não é mecânico fica sem nenhum.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMPETENCY_EQUIPMENTS.map((equipment) => {
            const pressed = matrix.equipments.includes(equipment.key);
            return (
              <button
                key={equipment.key}
                type="button"
                aria-pressed={pressed}
                disabled={setEquipments.isPending}
                onClick={() => toggleEquipment(equipment.key)}
                className={`rounded-control border px-3 py-2 text-sm font-medium transition ${
                  pressed ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-muted hover:bg-chip"
                }`}
              >
                {equipment.name}
              </button>
            );
          })}
        </div>
      </Card>
      {error ? <Notice>{errorMessage(error)}</Notice> : null}
      {matrix.equipments.length ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-sm">
              <Field label="Buscar habilidade">
                <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: selagem, sensor" />
              </Field>
            </div>
            <p className="text-xs text-muted">
              {COMPETENCY_SCORES.map((score) => `${score} ${COMPETENCY_SCORE_LABELS[score].label}`).join(" · ")} · N/A não se aplica
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {matrix.equipments.map((equipment) => (
              <Equipment
                key={equipment}
                matrix={matrix}
                equipment={equipment}
                open={open === equipment}
                onToggle={() => setOpen(open === equipment ? null : equipment)}
                query={query}
                onChange={(write) => setSkill.mutate(write)}
                disabled={setSkill.isPending}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>Escolha acima os equipamentos em que este técnico trabalha.</Card>
      )}
    </div>
  );
}

export function MatrixPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const members = useMembers();
  const matrix = useMatrix(memberId);
  const technicians = members.data?.filter((member) => member.position === "technician") ?? [];
  const selected = members.data?.find((member) => member.id === memberId);
  const notTechnician = selected !== undefined && selected.position !== "technician";
  return (
    <div>
      <PageTitle eyebrow="Apoio" title="Matriz de competências" text={COMPETENCY_MATRIX_TITLE} />
      <div className="mb-6 w-full sm:max-w-sm">
        <Field label="Técnico">
          <SelectInput value={memberId ?? ""} onChange={(event) => navigate(`/competencias/${event.target.value}`)}>
            <option value="" disabled>
              Escolha
            </option>
            {technicians.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.gradeName ? ` — ${member.gradeName}` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {!memberId ? <Card>Escolha um técnico para ver a matriz.</Card> : null}
      {memberId && matrix.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {matrix.isError ? <Notice>{errorMessage(matrix.error)}</Notice> : null}
      {notTechnician ? (
        <Card>
          A matriz de competências é só para técnico. {selected.name} é {positionLabel(selected.position).toLowerCase()}.
        </Card>
      ) : null}
      {matrix.data && !notTechnician ? <Matrix key={matrix.data.memberId} matrix={matrix.data} /> : null}
    </div>
  );
}
