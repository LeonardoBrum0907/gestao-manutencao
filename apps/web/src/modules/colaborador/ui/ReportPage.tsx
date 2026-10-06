import { Link, useParams } from "react-router-dom";
import type { ReactNode } from "react";
import {
  DEFAULT_PERFORMANCE_TARGET,
  BEHAVIOR_RATING_LABELS,
  PDI_ITEM_STATUS_LABELS,
  BEHAVIOR_TAG_GROUPS,
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_SCORE_LABELS,
  PRODUCTIVITY_LEVEL_LABELS,
  QUARTERS,
  type MemberDto,
} from "@manutencao/shared";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { useMachines, useMembers, useTeams } from "../../cadastro/data/cadastro";
import { positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamText } from "../../cadastro/model/team";
import { useMatrixCatalog, useMatrixSettings } from "../../competencia/data/catalog";
import { useMatrix } from "../../competencia/data/matrix";
import { average, bySubgroup, entriesById, equipmentName, expectedOf, percent, skillState, skillsOf } from "../../competencia/model/matrix";
import { flattenPages } from "../../registro/data/records";
import { formatWhen, toneLabel } from "../../registro/model/record";
import { useBehavior } from "../data/behavior";
import { useMemberRecordList } from "../data/member-records";
import { usePdi } from "../data/pdi";
import { usePdiItems } from "../data/pdi-items";
import { formatDay, isOverdue, sortItems, todayIso } from "../model/pdi-items";
import { usePerformance } from "../data/performance";
import { formatScore, scoreBand, thisYear } from "../model/performance";
import { performanceBand, quartersEvaluated } from "../model/report";
import { RankedChart } from "./RankedChart";
import "./report.css";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

const PILL_TONES = {
  ok: "bg-green-600/15 text-green-800",
  warn: "bg-amber-500/20 text-amber-800",
  bad: "bg-red-600/15 text-red-700",
  neutral: "bg-accent-soft text-accent",
} as const;
type PillTone = keyof typeof PILL_TONES;

function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[tone]}`}>{children}</span>;
}

const ratingTone = (rating: string): PillTone => (rating === "excellent" || rating === "good" ? "ok" : rating === "regular" ? "warn" : "bad");
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
    <svg viewBox="0 0 100 100" className={`h-24 w-24 ${value === null ? "text-muted" : BAND_TEXT[scoreBand(value)]}`} role="img" aria-label={`Média geral ${formatScore(value)} de 10`}>
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
    <div className="grid">
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
  const tagLabel = new Map(BEHAVIOR_TAG_GROUPS.flatMap((group) => group.tags.map((tag) => [tag.key, tag.label] as const)));
  return (
    <>
      <h2>Comportamento</h2>
      <div className="grid three">
        <Cell label="Pontualidade">
          {data?.punctuality ? <Pill tone={ratingTone(data.punctuality)}>{BEHAVIOR_RATING_LABELS[data.punctuality]}</Pill> : "—"}
        </Cell>
        <Cell label="Produtividade">
          {data?.productivity ? <Pill tone={productivityTone(data.productivity)}>{PRODUCTIVITY_LEVEL_LABELS[data.productivity]}</Pill> : "—"}
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
                <td className="n">{record.tone ? <Pill tone={record.tone === "positive" ? "ok" : record.tone === "negative" ? "bad" : "neutral"}>{toneLabel(record.tone)}</Pill> : "—"}</td>
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
                <b className={data.quarterAverages[quarter - 1] == null ? "text-muted" : ""}>{formatScore(data.quarterAverages[quarter - 1] ?? null)}</b>
              </div>
            ))}
          </div>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Média geral de {evaluated} trimestre(s) avaliado(s).
          </p>
        </div>
      </div>
      <RankedChart performance={data} target={settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET} />
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

function Pdi({ memberId }: { memberId: string }) {
  const pdi = usePdi(memberId);
  const pdiItems = usePdiItems(memberId);
  const members = useMembers();
  const machines = useMachines();
  const name = new Map((machines.data ?? []).map((machine) => [machine.id, machine.name]));
  const data = pdi.data;
  if (!data) return null;
  const today = todayIso();
  const planned = sortItems(pdiItems.data ?? []);
  const person = new Map((members.data ?? []).map((item) => [item.id, item.name]));
  const list = (ids: string[]) => (ids.length ? ids.map((id) => name.get(id) ?? id).join(", ") : "—");
  const images = data.attachments.filter((item) => item.mimeType.startsWith("image/"));
  const files = data.attachments.filter((item) => !item.mimeType.startsWith("image/"));
  return (
    <>
      <h2>PDI e feedback</h2>
      <div className="grid two">
        <Cell label="Padrinho de">{list(data.sponsorMachineIds)}</Cell>
        <Cell label="Em desenvolvimento">{list(data.developmentMachineIds)}</Cell>
      </div>
      <h3>Plano de ação</h3>
      {planned.length === 0 ? (
        <p className="muted">Nenhum item no plano.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ação</th>
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
                  {item.notes ? <span className="muted"> — {item.notes}</span> : null}
                </td>
                <td>{item.responsibleId ? (person.get(item.responsibleId) ?? "—") : "—"}</td>
                <td className={`n ${isOverdue(item, today) ? "late" : ""}`}>{formatDay(item.dueDate)}</td>
                <td>
                  {isOverdue(item, today) ? (
                    <Pill tone="bad">Atrasado</Pill>
                  ) : (
                    <Pill tone={item.status === "done" ? "ok" : item.status === "in_progress" ? "neutral" : item.status === "cancelled" ? "bad" : "warn"}>
                      {PDI_ITEM_STATUS_LABELS[item.status]}
                    </Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {files.length ? (
        <>
          <h3>Anexos</h3>
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                {file.fileName} <span className="muted">· {dateFormat.format(new Date(file.createdAt))}</span>
              </li>
            ))}
          </ul>
        </>
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
  const members = useMembers();
  const teams = useTeams();
  const member = members.data?.find((item) => item.id === memberId);
  const year = thisYear();

  if (members.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (!member) return <Card>Colaborador não encontrado.</Card>;
  const isTechnician = member.position === "technician";

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={`/cadastro/colaboradores/${member.id}`} className="text-sm font-medium text-accent hover:underline">
          ← Voltar à ficha
        </Link>
        <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
      </div>
      <p className="no-print mb-3 text-xs text-muted">Na janela de impressão, escolha “Salvar como PDF” e deixe os planos de fundo ligados.</p>
      {members.isError ? <Notice>Não foi possível carregar.</Notice> : null}
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
            Gerado em {dateFormat.format(new Date())}
          </div>
        </header>
        <div className="stripe" />
        <div className="content">
          <h2>Perfil</h2>
          <Profile member={member} teamLine={teamText(member, teams.data ?? []) ?? ""} />
          <Behavior memberId={member.id} />
          {isTechnician ? <Performance memberId={member.id} year={year} /> : null}
          {isTechnician ? <Matrix memberId={member.id} /> : null}
          <Pdi memberId={member.id} />
        </div>
        <footer>
          <span>Gestão de Manutenção · {member.name}</span>
          <span>Gerado em {dateFormat.format(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}
