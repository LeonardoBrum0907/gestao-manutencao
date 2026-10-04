import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MemberDto, RecordDto, TeamDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice, Stat } from "../../../design/ui/controls";
import { memberStatusClass, memberStatusLabel, positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamsOf } from "../../cadastro/model/team";
import { formatWhen, originLabel, recordShortName, statusChipClass, statusLabel } from "../../registro/model/record";
import { DueMark } from "../../registro/ui/RecordMarks";
import { useMemberRecords } from "../data/member-records";

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

function RecordRow({ record }: { record: RecordDto }) {
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

function RecordList({ title, records, empty }: { title: string; records: RecordDto[]; empty: string }) {
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <h2 className="px-4 py-3 text-sm font-semibold text-app">
        {title} <span className="font-normal text-muted">({records.length})</span>
      </h2>
      {records.length === 0 ? <p className="border-t border-t-line px-4 py-3 text-sm text-muted">{empty}</p> : null}
      <ul>
        {records.map((record) => (
          <RecordRow key={record.id} record={record} />
        ))}
      </ul>
    </section>
  );
}

export function ProfileTab({ member, members, teams }: { member: MemberDto; members: MemberDto[]; teams: TeamDto[] }) {
  const records = useMemberRecords(member.id);
  const all = records.data?.records ?? [];
  const pending = all.filter((record) => record.type !== "feedback");
  const open = pending.filter((record) => record.status !== "done");
  const done = pending.filter((record) => record.status === "done");
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
      {records.isError ? <Notice>{errorMessage(records.error)}</Notice> : null}
      {records.isPending ? <p className="text-sm text-muted">Carregando registros…</p> : null}
      {records.data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Em aberto" value={records.data.summary.open} />
            <Stat
              label="Vencidas"
              value={records.data.summary.overdue}
              tone={records.data.summary.overdue ? "text-danger" : ""}
            />
            <Stat label="Concluídos" value={records.data.summary.done} tone="text-accent" />
            <Stat label="Chamados" value={records.data.summary.chamados} />
            <Stat label="Feedbacks" value={records.data.summary.feedbacks} />
          </div>
          <RecordList title="Em aberto" records={open} empty="Nada em aberto com esta pessoa." />
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-app">
              Concluídos <span className="font-normal text-muted">({done.length})</span>
            </summary>
            <div className="mt-3">
              <RecordList title="Concluídos" records={done} empty="Nada concluído ainda." />
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
