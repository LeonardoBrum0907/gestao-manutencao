import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, RecordListItemDto, TeamDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, Stat } from "../../../design/ui/controls";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamsOf } from "../../cadastro/model/team";
import { flattenPages } from "../../registro/data/records";
import { formatWhen, originLabel, recordShortName, statusChipClass, statusLabel } from "../../registro/model/record";
import { DueMark } from "../../registro/ui/RecordMarks";
import { useMemberRecordList, useMemberRecordSummary } from "../data/member-records";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-app">{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

function TeamCard({ member, members, teams }: { member: MemberDto; members: MemberDto[]; teams: TeamDto[] }) {
  const own = teamsOf(member, teams);
  const names = new Map(members.map((item) => [item.id, item.name]));
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">Equipe</h2>
      {own.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          {member.position === "supervisor" ? "Não lidera nenhuma equipe." : "Sem equipe."}{" "}
          <Link to="/cadastro/equipes" className="font-medium text-accent hover:underline">
            Ver equipes
          </Link>
        </p>
      ) : null}
      <ul className="mt-3 flex flex-col gap-3">
        {own.map((team) => (
          <li key={team.id} className="text-sm">
            <p className="font-medium text-app">{team.name}</p>
            {member.position === "supervisor" ? (
              <p className="mt-1 text-muted">
                {team.memberIds.length
                  ? team.memberIds.map((id) => names.get(id)).filter(Boolean).join(", ")
                  : "Nenhum técnico ainda."}
              </p>
            ) : (
              <p className="mt-1 text-muted">
                Supervisor: {team.supervisorId ? names.get(team.supervisorId) ?? "—" : "sem supervisor"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RecordRow({ record }: { record: RecordListItemDto }) {
  return (
    <li>
      <Link
        to={`/registros/${record.id}`}
        className="flex items-start justify-between gap-3 border-t border-t-line px-4 py-3 transition hover:bg-accent-soft"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {recordShortName(record.type)}
            {record.origin !== "inbox" ? ` · ${originLabel(record.origin)}` : ""}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-app" title={record.body}>
            {record.body}
          </p>
          <p className="mt-1 text-xs text-muted">
            {formatWhen(record.occurredAt)}
            {record.type === "task" && record.dueAt ? (
              <>
                {" · Prazo "}
                <DueMark record={record} />
              </>
            ) : null}
          </p>
        </div>
        {record.type !== "feedback" ? (
          <span className={`shrink-0 ${statusChipClass(record.status)}`}>{statusLabel(record.status)}</span>
        ) : null}
      </Link>
    </li>
  );
}

function RecordList({
  title,
  total,
  query,
  empty,
}: {
  title: string;
  total: number | undefined;
  query: ReturnType<typeof useMemberRecordList>;
  empty: string;
}) {
  const records = flattenPages(query.data?.pages);
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <h2 className="px-4 py-3 text-sm font-semibold text-app">
        {title} <span className="font-normal text-muted">({total ?? records.length})</span>
      </h2>
      {query.isError ? <Notice>{errorMessage(query.error)}</Notice> : null}
      {query.isPending ? <p className="border-t border-t-line px-4 py-3 text-sm text-muted">Carregando…</p> : null}
      {query.isSuccess && records.length === 0 ? (
        <p className="border-t border-t-line px-4 py-3 text-sm text-muted">{empty}</p>
      ) : null}
      <ul>
        {records.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </ul>
      {query.hasNextPage ? (
        <div className="flex justify-center border-t border-t-line px-4 py-3">
          <Button tone="ghost" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

export function ProfileTab({ member, members, teams }: { member: MemberDto; members: MemberDto[]; teams: TeamDto[] }) {
  const summary = useMemberRecordSummary(member.id);
  const open = useMemberRecordList(member.id, "open");
  // Os concluídos só são buscados quando a seção é aberta.
  const [showDone, setShowDone] = useState(false);
  const done = useMemberRecordList(member.id, "done", showDone);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <h2 className="text-sm font-semibold text-app">Dados</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <Detail label="Cargo">{positionLabel(member.position)}</Detail>
            <Detail label="Função">{member.roleName}</Detail>
            <Detail label="Grau">{member.gradeName}</Detail>
            <Detail label="Turno">{shiftLabel(member.shift)}</Detail>
            <Detail label="Área">{member.area}</Detail>
            <Detail label="Status">
              <span className={memberStatusClass(member.status)}>{memberStatusLabel(member.status)}</span>
            </Detail>
            <Detail label="Matrícula">{member.registration}</Detail>
            <Detail label="Contato">{member.contact}</Detail>
          </dl>
          {member.notes ? <p className="mt-4 whitespace-pre-line text-sm text-muted">{member.notes}</p> : null}
        </Card>
        <TeamCard member={member} members={members} teams={teams} />
      </div>
      {summary.isError ? <Notice>{errorMessage(summary.error)}</Notice> : null}
      {summary.isPending ? <p className="text-sm text-muted">Carregando registros…</p> : null}
      {summary.data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Em aberto" value={summary.data.open} />
            <Stat
              label="Vencidas"
              value={summary.data.overdue}
              tone={summary.data.overdue ? "text-danger" : ""}
            />
            <Stat label="Concluídos" value={summary.data.done} tone="text-accent" />
            <Stat label="Chamados" value={summary.data.chamados} />
            <Stat label="Feedbacks" value={summary.data.feedbacks} />
          </div>
          <RecordList title="Em aberto" total={summary.data.open} query={open} empty="Nada em aberto com esta pessoa." />
          <details className="group" onToggle={(event) => event.currentTarget.open && setShowDone(true)}>
            <summary className="cursor-pointer text-sm font-semibold text-app">
              Concluídos <span className="font-normal text-muted">({summary.data.done})</span>
            </summary>
            <div className="mt-3">
              <RecordList title="Concluídos" total={summary.data.done} query={done} empty="Nada concluído ainda." />
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
