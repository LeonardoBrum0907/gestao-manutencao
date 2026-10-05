import { Link, useParams } from "react-router-dom";
import {
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
import { useMatrixCatalog } from "../../competencia/data/catalog";
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
import { formatScore, thisYear } from "../model/performance";
import { performanceBand, quartersEvaluated } from "../model/report";
import "./report.css";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function Profile({ member, teamLine }: { member: MemberDto; teamLine: string }) {
  const cells: [string, string][] = [
    ["Nome", member.name],
    ["Função", member.roleName ?? positionLabel(member.position)],
    ["Turno", shiftLabel(member.shift)],
    ["Matrícula", member.registration ?? "—"],
    ["Equipe", teamLine || "—"],
    ["Grau", member.gradeName ?? "—"],
    ["Área", member.area ?? "—"],
  ];
  return (
    <div className="grid">
      {cells.map(([label, value]) => (
        <div key={label} className="cell">
          <small>{label}</small>
          {value}
        </div>
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
      <div className="grid">
        <div className="cell">
          <small>Pontualidade</small>
          {data?.punctuality ? BEHAVIOR_RATING_LABELS[data.punctuality] : "—"}
        </div>
        <div className="cell">
          <small>Produtividade</small>
          {data?.productivity ? PRODUCTIVITY_LEVEL_LABELS[data.productivity] : "—"}
        </div>
        <div className="cell">
          <small>Colaboração</small>
          {data?.collaboration ? BEHAVIOR_RATING_LABELS[data.collaboration] : "—"}
        </div>
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
                <td className="n">{record.tone ? toneLabel(record.tone) : "—"}</td>
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
  const data = performance.data;
  if (!data) return null;
  const score = (competencyId: string, quarter: number) =>
    data.entries.find((entry) => entry.competencyId === competencyId && entry.quarter === quarter)?.score ?? null;
  const averageOf = (competencyId: string) => data.competencyAverages.find((item) => item.competencyId === competencyId)?.average ?? null;
  const evaluated = quartersEvaluated(data);
  return (
    <>
      <h2>Avaliação de desempenho · {year}</h2>
      <div className="big">
        <b>{formatScore(data.average)}</b>
        <span>
          {performanceBand(data.average)}
          <br />
          <span className="muted">
            Média geral · {evaluated} trimestre(s) avaliado(s)
          </span>
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Competência</th>
            {QUARTERS.map((quarter) => (
              <th key={quarter} className="n">
                {quarter}º tri.
              </th>
            ))}
            <th className="n">Média</th>
          </tr>
        </thead>
        <tbody>
          {data.competencies.map((competency) => (
            <tr key={competency.id}>
              <td>{competency.name}</td>
              {QUARTERS.map((quarter) => (
                <td key={quarter} className="n">
                  {score(competency.id, quarter) ?? "—"}
                </td>
              ))}
              <td className="n">
                <b>{formatScore(averageOf(competency.id))}</b>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <b>Média trimestral</b>
            </td>
            {QUARTERS.map((quarter) => (
              <td key={quarter} className="n">
                <b>{formatScore(data.quarterAverages[quarter - 1] ?? null)}</b>
              </td>
            ))}
            <td className="n">
              <b>{formatScore(data.average)}</b>
            </td>
          </tr>
        </tbody>
      </table>
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
        <div className="cell">
          <small>Avaliadas</small>
          {summary.scored}/{summary.applicable + summary.notApplicable}
        </div>
        <div className="cell">
          <small>Atende</small>
          {summary.meets}
        </div>
        <div className="cell">
          <small>Abaixo</small>
          {summary.below}
        </div>
        <div className="cell">
          <small>Aderência</small>
          {percent(summary.adherence)} · média {average(summary.average)}
        </div>
      </div>
      <p className="muted">
        {Object.entries(COMPETENCY_SCORE_LABELS)
          .map(([score, item]) => `${score} ${item.label}`)
          .join(" · ")}
        {" · "}E esperado · R real
      </p>
      {groups.map((group) => (
        <section key={group.equipmentId}>
          <h3>
            {equipmentName(catalog.data, group.equipmentId)}
            {group.summary ? ` — ${group.summary.meets}/${group.summary.applicable} atendidas (${percent(group.summary.adherence)})` : ""}
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
                        <td className={state === "meets" ? "ok" : state === "below" ? "bad" : "muted"}>
                          {state === "na"
                            ? "Não se aplica"
                            : score === null
                              ? "—"
                              : `${state === "meets" ? "✔" : "✖"} ${COMPETENCY_SCORE_LABELS[score].label}`}
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
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="cell">
          <small>Padrinho de</small>
          {list(data.sponsorMachineIds)}
        </div>
        <div className="cell">
          <small>Em desenvolvimento</small>
          {list(data.developmentMachineIds)}
        </div>
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
                <td className={`n ${isOverdue(item, today) ? "bad" : ""}`}>{formatDay(item.dueDate)}</td>
                <td className={item.status === "done" ? "ok" : ""}>{PDI_ITEM_STATUS_LABELS[item.status]}</td>
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
      <article className="report">
        <p className="brand">Gestão de Manutenção · Avaliação de colaborador</p>
        <h1>{member.name}</h1>
        <p className="sub">{member.roleName ?? positionLabel(member.position)}</p>
        <h2>Perfil</h2>
        <Profile member={member} teamLine={teamText(member, teams.data ?? []) ?? ""} />
        <Behavior memberId={member.id} />
        {isTechnician ? <Performance memberId={member.id} year={year} /> : null}
        {isTechnician ? <Matrix memberId={member.id} /> : null}
        <Pdi memberId={member.id} />
        <footer>
          <span>Gestão de Manutenção</span>
          <span>Gerado em {dateFormat.format(new Date())}</span>
        </footer>
      </article>
    </div>
  );
}
