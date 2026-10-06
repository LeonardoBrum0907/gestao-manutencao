import { useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  COMPETENCY_LEVEL_EXPECTED,
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_MATRIX_TITLE,
  COMPETENCY_SCORE_LABELS,
  COMPETENCY_SCORES,
  type CompetencyEntryDto,
  type CompetencyScore,
  type MatrixCatalogDto,
  type MatrixSkillDto,
  type CompetencySummaryDto,
  type MemberMatrixDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, Stat, TextInput } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../data/catalog";
import { useMatrix, useSetMatrixEquipments, useSetSkill, useSetSkills, type SkillWrite } from "../data/matrix";
import {
  adherenceTone,
  average,
  bySubgroup,
  entriesById,
  equipmentName,
  expectedOf,
  matchesSearch,
  pendingExpected,
  percent,
  skillsOf,
  skillState,
  stateRowClass,
} from "../model/matrix";
import { SkillScore, type ScoreValue } from "./SkillScore";

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

function focusSibling(row: HTMLElement, step: 1 | -1) {
  const rows = [...(row.closest("[data-matrix]")?.querySelectorAll<HTMLElement>("[data-skill-row]") ?? [])];
  rows[rows.indexOf(row) + step]?.focus();
}

function SkillRow({
  skill,
  entry,
  onChange,
}: {
  skill: MatrixSkillDto;
  entry: CompetencyEntryDto | undefined;
  onChange: (write: SkillWrite) => void;
}) {
  const state = skillState(skill, entry);
  const expected = expectedOf(skill, entry);
  const base = {
    skillId: skill.id,
    score: entry?.score ?? null,
    notApplicable: entry?.notApplicable ?? false,
    expected: entry?.expected ?? null,
  };
  const set = (next: ScoreValue) => onChange({ ...base, ...next });

  // Teclado com a linha (ou o seletor dela) em foco: 0 a 4 = nota, N = não se aplica, E = atende o esperado,
  // Del = limpar. Depois de marcar, o foco desce para a próxima habilidade.
  function onKeyDown(event: KeyboardEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement;
    if (target !== event.currentTarget && !target.hasAttribute("data-skill-pill")) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (/^[0-4]$/.test(key)) set({ score: Number(key) as CompetencyScore, notApplicable: false });
    else if (key === "n") set({ score: null, notApplicable: true });
    else if (key === "e") set({ score: expected as CompetencyScore, notApplicable: false });
    else if (key === "delete" || key === "backspace") {
      event.preventDefault();
      set({ score: null, notApplicable: false });
      return;
    } else if (key === "arrowdown" || key === "arrowup") {
      event.preventDefault();
      focusSibling(event.currentTarget, key === "arrowdown" ? 1 : -1);
      return;
    } else return;
    event.preventDefault();
    focusSibling(event.currentTarget, 1);
  }

  return (
    <li
      data-skill-row
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`flex flex-col gap-3 border-l-4 border-t border-t-line bg-card px-3 py-3 outline-none focus:bg-accent-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between ${stateRowClass[state]}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-app">{skill.text}</p>
        <p className="mt-1 text-xs text-muted">
          {COMPETENCY_LEVEL_LABELS[skill.level]} · esperado{" "}
          <select
            aria-label={`Esperado em ${skill.text}`}
            className="rounded-control border border-line bg-surface px-1 py-0.5 text-xs text-app"
            value={entry?.expected ?? ""}
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
      <SkillScore
        skillText={skill.text}
        state={state}
        value={{ score: base.score, notApplicable: base.notApplicable }}
        onPick={set}
      />
    </li>
  );
}

function Equipment({
  catalog,
  matrix,
  equipment,
  open,
  onToggle,
  query,
  onChange,
  onBulk,
  bulkPending,
}: {
  catalog: MatrixCatalogDto;
  matrix: MemberMatrixDto;
  equipment: string;
  open: boolean;
  onToggle: () => void;
  query: string;
  onChange: (write: SkillWrite) => void;
  onBulk: (writes: SkillWrite[]) => void;
  bulkPending: boolean;
}) {
  const summary = matrix.byEquipment.find((item) => item.equipment === equipment);
  const entries = entriesById(matrix.entries);
  const skills = skillsOf(catalog, equipment).filter((skill) => matchesSearch(skill, query));
  if (query && skills.length === 0) return null;
  const expanded = open || Boolean(query);
  // "Atende o esperado": só o que ainda está sem nota (e não é "não se aplica"); o que já tem nota não muda.
  const fill = (list: MatrixSkillDto[]) => () =>
    onBulk(
      pendingExpected(list, entries).map((skill) => ({
        skillId: skill.id,
        score: expectedOf(skill, entries.get(skill.id)) as CompetencyScore,
        notApplicable: false,
        expected: entries.get(skill.id)?.expected ?? null,
      })),
    );
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-chip sm:px-5"
      >
        <span className="font-semibold text-app">{equipmentName(catalog, equipment)}</span>
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
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-5">
            <p className="text-xs text-muted">
              Clique na nota para escolher. Com a linha em foco: <kbd className="rounded border border-line px-1">0</kbd> a{" "}
              <kbd className="rounded border border-line px-1">4</kbd>, <kbd className="rounded border border-line px-1">N</kbd> não se aplica,{" "}
              <kbd className="rounded border border-line px-1">E</kbd> atende o esperado, <kbd className="rounded border border-line px-1">Del</kbd> limpa.
            </p>
            <Button tone="ghost" className="px-3 py-1.5" disabled={bulkPending || pendingExpected(skills, entries).length === 0} onClick={fill(skills)}>
              Atende o esperado em tudo sem nota
            </Button>
          </div>
          {bySubgroup(skills).map((group) => (
            <div key={group.subgroup}>
              <div className="flex items-center justify-between gap-2 bg-chip px-4 py-2 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{group.subgroup}</p>
                <Button
                  tone="ghost"
                  className="px-2.5 py-1 text-xs"
                  disabled={bulkPending || pendingExpected(group.skills, entries).length === 0}
                  onClick={fill(group.skills)}
                >
                  Atende o esperado
                </Button>
              </div>
              <ul>
                {group.skills.map((skill) => (
                  <SkillRow
                    key={skill.id}
                    skill={skill}
                    entry={entries.get(skill.id)}
                    onChange={onChange}
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

function Matrix({ catalog, matrix }: { catalog: MatrixCatalogDto; matrix: MemberMatrixDto }) {
  const setEquipments = useSetMatrixEquipments(matrix.memberId);
  const setSkill = useSetSkill(matrix.memberId);
  const setSkills = useSetSkills(matrix.memberId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(matrix.equipments[0] ?? null);

  function toggleEquipment(key: string) {
    const next = matrix.equipments.includes(key)
      ? matrix.equipments.filter((item) => item !== key)
      : [...matrix.equipments, key];
    setEquipments.mutate(next);
  }

  const error = setEquipments.error ?? setSkill.error ?? setSkills.error;
  return (
    <div data-matrix className="flex flex-col gap-6">
      <Summary summary={matrix.summary} />
      <Card>
        <h2 className="text-sm font-semibold text-app">Equipamentos que se aplicam</h2>
        <p className="mt-1 text-sm text-muted">A aderência conta só estes. Quem não é mecânico fica sem nenhum.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {catalog.equipments
            .filter((equipment) => !equipment.archived)
            .map((equipment) => {
              const pressed = matrix.equipments.includes(equipment.id);
              return (
                <button
                  key={equipment.id}
                  type="button"
                  aria-pressed={pressed}
                  disabled={setEquipments.isPending}
                  onClick={() => toggleEquipment(equipment.id)}
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
              {COMPETENCY_SCORES.map((score) => `${score} ${COMPETENCY_SCORE_LABELS[score].label}`).join(" · ")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {matrix.equipments.map((equipment) => (
              <Equipment
                key={equipment}
                catalog={catalog}
                matrix={matrix}
                equipment={equipment}
                open={open === equipment}
                onToggle={() => setOpen(open === equipment ? null : equipment)}
                query={query}
                onChange={(write) => setSkill.mutate(write)}
                onBulk={(writes) => writes.length && setSkills.mutate(writes)}
                bulkPending={setSkills.isPending}
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

export function MatrixPanel({ memberId }: { memberId: string }) {
  const matrix = useMatrix(memberId);
  const catalog = useMatrixCatalog();
  if (matrix.isPending || catalog.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (matrix.isError) return <Notice>{errorMessage(matrix.error)}</Notice>;
  if (catalog.isError) return <Notice>{errorMessage(catalog.error)}</Notice>;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">{COMPETENCY_MATRIX_TITLE}</p>
        <Link to="/configuracoes/avaliacao" className="text-sm font-medium text-accent hover:underline">
          Editar equipamentos e habilidades
        </Link>
      </div>
      <Matrix key={matrix.data.memberId} catalog={catalog.data} matrix={matrix.data} />
    </div>
  );
}
