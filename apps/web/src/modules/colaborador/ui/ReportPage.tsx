import { Link, useParams, useSearchParams } from "react-router-dom";
import { type ReactNode } from "react";
import {
  DEFAULT_PERFORMANCE_TARGET,
  BEHAVIOR_RATING_LABELS,
  PDI_ITEM_STATUS_LABELS,
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_SCORE_LABELS,
  PRODUCTIVITY_LEVEL_LABELS,
  QUARTERS,
  type MemberDto,
  type PdiItemDto,
} from "@manutencao/shared";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { useLines, useMembers, useTeams } from "../../cadastro/data/cadastro";
import { usePerformanceCompetencies } from "../../cadastro/data/competencies";
import { positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamText } from "../../cadastro/model/team";
import { useMatrixCatalog, useMatrixSettings } from "../../competencia/data/catalog";
import { useMatrix } from "../../competencia/data/matrix";
import { average, bySubgroup, entriesById, equipmentName, expectedOf, percent, skillState, skillsOf } from "../../competencia/model/matrix";
import { flattenPages } from "../../registro/data/records";
import { formatWhen, toneLabel } from "../../registro/model/record";
import { useBehaviorTags } from "../../cadastro/data/behavior-tags";
import { useBehavior } from "../data/behavior";
import { useMemberRecordList } from "../data/member-records";
import { usePdi } from "../data/pdi";
import { usePdiItems } from "../data/pdi-items";
import { belowTarget, formatDay, isOverdue, itemCounts, sortItems, todayIso } from "../model/pdi-items";
import { usePerformance } from "../data/performance";
import { formatScore, scoreBand, thisYear } from "../model/performance";
import { parseReportSections, performanceBand, quartersEvaluated, REPORT_SECTIONS, reportSectionsFor } from "../model/report";
import { RankedChart } from "./RankedChart";
import { NavTrail } from "../../../design/ui/nav-trail";
import { usePreviewZoom, ZoomControls } from "../../../design/ui/sheet-preview";
import "../../../design/ui/report.css";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const PILL_TONES = {
  ok: "bg-green-600/15 text-green-800",
  warn: "bg-amber-500/20 text-amber-800",
  bad: "bg-red-600/15 text-red-700",
  neutral: "bg-accent-soft text-accent",
} as const;
type PillTone = keyof typeof PILL_TONES;

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

const ratingTone = (rating: string): PillTone =>
  rating === "excellent" || rating === "good" ? "ok" : rating === "regular" ? "warn" : "bad";
const productivityTone = (level: string): PillTone => (level === "high" ? "ok" : level === "medium" ? "warn" : "bad");

const BAND_TEXT = { high: "text-green-600", good: "text-lime-500", mid: "text-amber-500", low: "text-red-600" } as const;

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="cell rounded-control border border-line bg-chip px-3 py-2">
      <small>{label}</small>
      <div className="font-semibold">{children}</div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

// Anel da média geral (0 a 10), na cor da faixa da nota.
function ScoreRing({ value }: { value: number | null }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const filled = value === null ? 0 : (Math.max(0, Math.min(10, value)) / 10) * circumference;
  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-24 w-24 ${value === null ? "text-muted" : BAND_TEXT[scoreBand(value)]}`}
      role="img"
      aria-label={`Média geral ${formatScore(value)} de 10`}
    >
      <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="52" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--text)">
        {formatScore(value)}
      </text>
      <text x="50" y="68" textAnchor="middle" fontSize="9" fill="var(--muted)">
        de 10
      </text>
    </svg>
  );
}

function Profile({ member, teamLine }: { member: MemberDto; teamLine: string }) {
  const cells: [string, string][] = [
    ["Matrícula", member.registration ?? "—"],
    ["Turno", shiftLabel(member.shift)],
    ["Equipe", teamLine || "—"],
    ["Grau", member.gradeName ?? "—"],
    ["Área", member.area ?? "—"],
  ];
  return (
    <div className="grid five">
      {cells.map(([label, value]) => (
        <Cell key={label} label={label}>
          {value}
        </Cell>
      ))}
    </div>
  );
}

function Behavior({ memberId }: { memberId: string }) {
  const behavior = useBehavior(memberId);
  const feedbacks = useMemberRecordList(memberId, "feedback");
  const items = flattenPages(feedbacks.data?.pages);
  const data = behavior.data;
  const tags = useBehaviorTags();
  const tagLabel = new Map((tags.data ?? []).map((tag) => [tag.id, tag.name] as const));
  return (
    <>
      <h2>Comportamento</h2>
      <div className="grid three">
        <Cell label="Pontualidade">
          {data?.punctuality ? <Pill tone={ratingTone(data.punctuality)}>{BEHAVIOR_RATING_LABELS[data.punctuality]}</Pill> : "—"}
        </Cell>
        <Cell label="Produtividade">
          {data?.productivity ? (
            <Pill tone={productivityTone(data.productivity)}>{PRODUCTIVITY_LEVEL_LABELS[data.productivity]}</Pill>
          ) : (
            "—"
          )}
        </Cell>
        <Cell label="Colaboração">
          {data?.collaboration ? <Pill tone={ratingTone(data.collaboration)}>{BEHAVIOR_RATING_LABELS[data.collaboration]}</Pill> : "—"}
        </Cell>
      </div>
      {data?.tags.length ? (
        <p>
          {data.tags.map((tag) => (
            <span key={tag} className="chip">
              {tagLabel.get(tag) ?? tag}
            </span>
          ))}
        </p>
      ) : null}
      <h3>Histórico de observações</h3>
      {items.length === 0 ? (
        <p className="muted">Nenhuma observação registrada.</p>
      ) : (
        <table>
          <tbody>
            {items.map((record) => (
              <tr key={record.id}>
                <td className="n muted">{formatWhen(record.occurredAt)}</td>
                <td className="n">
                  {record.tone ? (
                    <Pill tone={record.tone === "positive" ? "ok" : record.tone === "negative" ? "bad" : "neutral"}>
                      {toneLabel(record.tone)}
                    </Pill>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{record.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function Performance({ memberId, year }: { memberId: string; year: number }) {
  const performance = usePerformance(memberId, year);
  const settings = useMatrixSettings();
  const data = performance.data;
  if (!data) return null;
  const evaluated = quartersEvaluated(data);
  return (
    <>
      <h2>Avaliação de desempenho · {year}</h2>
      <div className="perf-top">
        <div className="score">
          <ScoreRing value={data.average} />
          <span className="band">{performanceBand(data.average) || "Sem nota"}</span>
        </div>
        <div>
          <div className="grid quarters">
            {QUARTERS.map((quarter) => (
              <div key={quarter} className="q rounded-control border border-line px-3 py-2">
                <small>{quarter}º tri</small>
                <b className={data.quarterAverages[quarter - 1] == null ? "text-muted" : ""}>
                  {formatScore(data.quarterAverages[quarter - 1] ?? null)}
                </b>
              </div>
            ))}
          </div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Média geral de {evaluated} trimestre(s) avaliado(s).
          </p>
        </div>
      </div>
      <RankedChart performance={data} target={settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET} fixed />
    </>
  );
}

function Matrix({ memberId }: { memberId: string }) {
  const matrix = useMatrix(memberId);
  const catalog = useMatrixCatalog();
  if (!matrix.data || !catalog.data) return null;
  const summary = matrix.data.summary;
  const entries = entriesById(matrix.data.entries);
  const groups = matrix.data.equipments.map((equipmentId) => {
    const skills = skillsOf(catalog.data, equipmentId).filter((skill) => {
      const entry = entries.get(skill.id);
      return entry && (entry.score !== null || entry.notApplicable);
    });
    return { equipmentId, skills, summary: matrix.data.byEquipment.find((item) => item.equipment === equipmentId) };
  });
  const hidden = summary.unscored;
  return (
    <>
      <h2>Matriz de competências</h2>
      <div className="grid">
        <Cell label="Avaliadas">
          {summary.scored}/{summary.applicable + summary.notApplicable}
        </Cell>
        <Cell label="Atende">
          <span className="text-green-700">{summary.meets}</span>
        </Cell>
        <Cell label="Abaixo">
          <span className="text-red-700">{summary.below}</span>
        </Cell>
        <Cell label="Aderência">
          {percent(summary.adherence)} <span className="muted font-normal">· média {average(summary.average)}</span>
        </Cell>
      </div>
      <p className="muted">
        {Object.entries(COMPETENCY_SCORE_LABELS)
          .map(([score, item]) => `${score} ${item.label}`)
          .join(" · ")}
        {" · "}E esperado · R real
      </p>
      {groups.map((group) => (
        <section key={group.equipmentId}>
          <h3 className="eq">
            <span>{equipmentName(catalog.data, group.equipmentId)}</span>
            {group.summary ? (
              <span className="eq-meta">
                {group.summary.meets}/{group.summary.applicable} atendidas ({percent(group.summary.adherence)})
                <span className="bar">
                  <span style={{ width: `${Math.max(0, Math.min(100, group.summary.adherence ?? 0))}%` }} />
                </span>
              </span>
            ) : null}
          </h3>
          {group.skills.length === 0 ? (
            <p className="muted">Sem notas lançadas.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Subconjunto</th>
                  <th>Habilidade</th>
                  <th className="n">E</th>
                  <th className="n">R</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {bySubgroup(group.skills).flatMap((subgroup) =>
                  subgroup.skills.map((skill, index) => {
                    const entry = entries.get(skill.id);
                    const state = skillState(skill, entry);
                    const score = entry?.score ?? null;
                    return (
                      <tr key={skill.id}>
                        <td className="muted">{index === 0 ? subgroup.subgroup : ""}</td>
                        <td>
                          {skill.text} <span className="muted">({COMPETENCY_LEVEL_LABELS[skill.level]})</span>
                        </td>
                        <td className="n">{expectedOf(skill, entry)}</td>
                        <td className="n">{state === "na" ? "N/A" : score}</td>
                        <td>
                          {state === "na" ? (
                            <Pill tone="neutral">Não se aplica</Pill>
                          ) : score === null ? (
                            "—"
                          ) : (
                            <Pill tone={state === "meets" ? "ok" : "bad"}>
                              {state === "meets" ? "✔" : "✖"} {COMPETENCY_SCORE_LABELS[score].label}
                            </Pill>
                          )}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          )}
        </section>
      ))}
      {hidden > 0 ? <p className="muted">{hidden} habilidade(s) ainda sem nota não aparecem acima.</p> : null}
    </>
  );
}

const statusTone = (item: PdiItemDto, today: string): PillTone =>
  isOverdue(item, today)
    ? "bad"
    : item.status === "done"
      ? "ok"
      : item.status === "in_progress"
        ? "neutral"
        : item.status === "cancelled"
          ? "bad"
          : "warn";

// Pontos a desenvolver: competências do ano abaixo da meta e habilidades da matriz abaixo do esperado, dizendo se já têm item no plano.
function PdiGaps({ memberId, year, items }: { memberId: string; year: number; items: PdiItemDto[] }) {
  const performance = usePerformance(memberId, year);
  const settings = useMatrixSettings();
  const matrix = useMatrix(memberId);
  const catalog = useMatrixCatalog();
  const target = settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET;
  const planned = (pick: (item: PdiItemDto) => string | null, id: string) =>
    items.some((item) => pick(item) === id && item.status !== "cancelled");
  const competencies = performance.data
    ? performance.data.competencyAverages
        .filter((row) => belowTarget(row.average, target))
        .map((row) => ({
          id: row.competencyId,
          name: performance.data.competencies.find((competency) => competency.id === row.competencyId)?.name ?? "",
          average: row.average,
          planned: planned((item) => item.competencyId, row.competencyId),
        }))
        .sort((x, y) => (x.average ?? 0) - (y.average ?? 0))
    : [];
  const entries = entriesById(matrix.data?.entries ?? []);
  const skills =
    matrix.data && catalog.data
      ? catalog.data.skills
          .filter((skill) => !skill.archived && matrix.data.equipments.includes(skill.equipmentId))
          .filter((skill) => skillState(skill, entries.get(skill.id)) === "below")
          .map((skill) => {
            const entry = entries.get(skill.id);
            const expected = expectedOf(skill, entry);
            return { skill, expected, real: entry?.score ?? 0, gap: expected - (entry?.score ?? 0), planned: planned((item) => item.skillId, skill.id) };
          })
          .sort((x, y) => Number(x.planned) - Number(y.planned) || y.gap - x.gap)
      : [];
  const shown = skills.slice(0, SKILL_GAPS_SHOWN);
  const skillsPlanned = skills.filter((item) => item.planned).length;
  if (!performance.data && !matrix.data) return null;
  return (
    <>
      <h3>Pontos a desenvolver</h3>
      {competencies.length === 0 && skills.length === 0 ? (
        <p className="muted">Nenhuma competência abaixo da meta em {year} e nenhuma habilidade da matriz abaixo do esperado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Origem</th>
              <th>Ponto</th>
              <th className="n">Nota</th>
              <th>No plano</th>
            </tr>
          </thead>
          <tbody>
            {competencies.map((row) => (
              <tr key={row.id}>
                <td className="muted">Avaliação {year}</td>
                <td>{row.name}</td>
                <td className="n late">
                  {formatScore(row.average)} <span className="muted font-normal">/ meta {target}</span>
                </td>
                <td>{row.planned ? <Pill tone="ok">Com item</Pill> : <Pill tone="warn">Sem item</Pill>}</td>
              </tr>
            ))}
            {catalog.data
              ? shown.map((row) => (
                  <tr key={row.skill.id}>
                    <td className="muted">Matriz · {equipmentName(catalog.data, row.skill.equipmentId)}</td>
                    <td>{row.skill.text}</td>
                    <td className="n">
                      R {row.real} <span className="muted">/ E {row.expected}</span>
                    </td>
                    <td>{row.planned ? <Pill tone="ok">Com item</Pill> : <Pill tone="warn">Sem item</Pill>}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      )}
      {skills.length ? (
        <p className="muted">
          Matriz: {skills.length} habilidade(s) abaixo do esperado, {skillsPlanned} com item no plano
          {skills.length > shown.length ? `; acima, as ${shown.length} primeiras (sem item e maior diferença primeiro)` : ""}.
        </p>
      ) : null}
    </>
  );
}

const SKILL_GAPS_SHOWN = 10;

function Pdi({ memberId, isTechnician, year }: { memberId: string; isTechnician: boolean; year: number }) {
  const pdi = usePdi(memberId);
  const pdiItems = usePdiItems(memberId);
  const members = useMembers();
  const lines = useLines();
  const competencies = usePerformanceCompetencies();
  const catalog = useMatrixCatalog();
  const data = pdi.data;
  if (!data) return null;
  const today = todayIso();
  const planned = sortItems(pdiItems.data ?? []);
  const counts = itemCounts(planned, today);
  const active = planned.filter((item) => item.status !== "cancelled").length;
  const person = new Map((members.data ?? []).map((item) => [item.id, item.name]));
  const lineName = new Map((lines.data ?? []).map((line) => [line.id, line.name]));
  const competencyName = new Map((competencies.data ?? []).map((competency) => [competency.id, competency.name]));
  const skill = new Map((catalog.data?.skills ?? []).map((item) => [item.id, item]));
  const focus = (item: PdiItemDto) => {
    const parts: string[] = [];
    if (item.competencyId) parts.push(`Competência: ${competencyName.get(item.competencyId) ?? "—"}`);
    const matrixSkill = item.skillId ? skill.get(item.skillId) : undefined;
    if (matrixSkill && catalog.data) parts.push(`Matriz: ${equipmentName(catalog.data, matrixSkill.equipmentId)} · ${matrixSkill.text}`);
    if (item.lineId) parts.push(`Linha ${lineName.get(item.lineId) ?? "—"}`);
    return parts;
  };
  const images = data.attachments.filter((item) => item.mimeType.startsWith("image/"));
  const files = data.attachments.filter((item) => !item.mimeType.startsWith("image/"));
  return (
    <>
      <h2>PDI e feedback</h2>
      <div className="grid">
        <Cell label="Itens no plano">{active}</Cell>
        <Cell label="Em aberto">{counts.open}</Cell>
        <Cell label="Atrasados">{counts.overdue ? <span className="text-red-700">{counts.overdue}</span> : 0}</Cell>
        <Cell label="Concluídos">
          {counts.done}
          {active ? <span className="muted font-normal"> · {Math.round((counts.done / active) * 100)}%</span> : null}
        </Cell>
      </div>
      <h3>Plano de ação</h3>
      {planned.length === 0 ? (
        <p className="muted">Nenhum item no plano.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ação</th>
              <th>Foco</th>
              <th>Responsável</th>
              <th className="n">Prazo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {planned.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.title}
                  {item.notes ? <div className="muted">{item.notes}</div> : null}
                </td>
                <td>
                  {focus(item).length ? (
                    focus(item).map((part) => <div key={part}>{part}</div>)
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{item.responsibleId ? (person.get(item.responsibleId) ?? "—") : "—"}</td>
                <td className={`n ${isOverdue(item, today) ? "late" : ""}`}>{formatDay(item.dueDate)}</td>
                <td>
                  <Pill tone={statusTone(item, today)}>{isOverdue(item, today) ? "Atrasado" : PDI_ITEM_STATUS_LABELS[item.status]}</Pill>
                  {item.completedAt ? <div className="muted">em {formatDay(item.completedAt.slice(0, 10))}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isTechnician ? <PdiGaps memberId={memberId} year={year} items={planned} /> : null}
      <h3>Anexos</h3>
      {files.length ? (
        <ul>
          {files.map((file) => (
            <li key={file.id}>
              {file.fileName} <span className="muted">· {dateFormat.format(new Date(file.createdAt))}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {images.length ? (
        <div className="att">
          {images.map((image) => (
            <figure key={image.id}>
              <img src={`/api/members/${memberId}/pdi/attachments/${image.id}`} alt={image.fileName} />
              <figcaption className="muted">{image.fileName}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {data.attachments.length === 0 ? <p className="muted">Nenhum anexo.</p> : null}
    </>
  );
}

export function ReportPage() {
  const { memberId = "" } = useParams();
  const [search] = useSearchParams();
  const preview = usePreviewZoom();
  const members = useMembers();
  const teams = useTeams();
  const member = members.data?.find((item) => item.id === memberId);
  const year = thisYear();

  if (members.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (!member) return <Card>Colaborador não encontrado.</Card>;
  const isTechnician = member.position === "technician";
  const sections = parseReportSections(search.get("secoes"), isTechnician);
  const partial = sections.length < reportSectionsFor(isTechnician).length;
  const has = (key: (typeof sections)[number]) => sections.includes(key);
  const partialLabel = REPORT_SECTIONS.filter((section) => sections.includes(section.key))
    .map((section) => section.label)
    .join(" · ");

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <NavTrail current={`Relatório de ${member.name}`} back={{ to: `/cadastro/colaboradores/${member.id}`, label: member.name }} className="" />
        <div className="flex flex-wrap items-center gap-2">
          <ZoomControls preview={preview} />
          <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
        </div>
      </div>
      <p className="no-print mb-3 text-xs text-muted">
        Esta é a folha A4 como sai no PDF: aproxime, afaste e role para conferir. Na janela de impressão, escolha “Salvar como PDF” e deixe
        os planos de fundo ligados.
      </p>
      {members.isError ? <Notice>Não foi possível carregar.</Notice> : null}
      <div ref={preview.frame} className="report-frame">
        <div className="report-zoom" style={{ zoom: preview.zoom }}>
          <div ref={preview.sheet} className="report-sheet">
            <article className="report" data-theme="light">
              <header className="hero">
                <div className="avatar" aria-hidden>
                  {initials(member.name)}
                </div>
                <div>
                  <p className="brand">Gestão de Manutenção · Avaliação de colaborador</p>
                  <h1>{member.name}</h1>
                  <p className="sub">{member.roleName ?? positionLabel(member.position)}</p>
                </div>
                <div className="meta">
                  <b>Ano {year}</b>
                  {partial ? (
                    <>
                      {partialLabel}
                      <br />
                    </>
                  ) : null}
                  Gerado em {dateFormat.format(new Date())}
                </div>
              </header>
              <div className="stripe" />
              <div className="content">
                {has("perfil") ? (
                  <>
                    <h2>Perfil</h2>
                    <Profile member={member} teamLine={teamText(member, teams.data ?? []) ?? ""} />
                  </>
                ) : null}
                {has("comportamento") ? <Behavior memberId={member.id} /> : null}
                {isTechnician && has("desempenho") ? <Performance memberId={member.id} year={year} /> : null}
                {isTechnician && has("matriz") ? <Matrix memberId={member.id} /> : null}
                {has("pdi") ? <Pdi memberId={member.id} isTechnician={isTechnician} year={year} /> : null}
              </div>
              <footer>
                <span>Gestão de Manutenção · {member.name}</span>
                <span>Gerado em {dateFormat.format(new Date())}</span>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
