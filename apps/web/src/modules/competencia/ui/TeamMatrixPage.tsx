import { useState } from "react";
import { Link } from "react-router-dom";
import { MEMBER_SHIFTS, MEMBER_SHIFT_LABELS, type MemberShift, type TeamMatrixDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { useTeamMatrix } from "../data/matrix";
import { alertsOf, cellClass, coverageLabel, qualifiedMembers, statusChipClass } from "../model/team";

function shiftName(shift: string): string {
  return MEMBER_SHIFT_LABELS[shift as MemberShift] ?? shift;
}

function Alerts({ team }: { team: TeamMatrixDto }) {
  const alerts = alertsOf(team);
  const late = team.members.filter((member) => member.pdiOverdue > 0);
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">Alertas</h2>
      {alerts.length === 0 && late.length === 0 ? <p className="mt-2 text-sm text-muted">Nenhum alerta: todos os equipamentos estão cobertos e sem PDI atrasado.</p> : null}
      <ul className="mt-2 flex flex-col gap-2">
        {alerts.map((equipment) => {
          const names = qualifiedMembers(team, equipment.id).map((member) => member.name);
          return (
            <li key={equipment.id} className="flex flex-wrap items-center gap-2 text-sm text-app">
              <span className={statusChipClass(equipment.status)}>{coverageLabel[equipment.status]}</span>
              <span className="font-medium">{equipment.name}</span>
              <span className="text-muted">
                {equipment.qualified} qualificado(s){equipment.minQualified ? ` de ${equipment.minQualified} necessário(s)` : ""}
                {equipment.status === "single" && names.length ? `: só ${names[0]}` : ""}
              </span>
            </li>
          );
        })}
        {late.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-2 text-sm text-app">
            <span className="rounded-control bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">PDI atrasado</span>
            <Link to={`/cadastro/colaboradores/${member.id}/pdi`} className="font-medium text-accent hover:underline">
              {member.name}
            </Link>
            <span className="text-muted">{member.pdiOverdue} item(ns) vencido(s)</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Heatmap({ team, shift }: { team: TeamMatrixDto; shift: string }) {
  const members = team.members.filter((member) => !shift || member.shift === shift);
  return (
    <Card compact className="overflow-hidden !p-0">
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.06em] text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-card px-4 py-3 font-semibold">Técnico</th>
              {team.equipments.map((equipment) => (
                <th key={equipment.id} className="min-w-24 px-2 py-3 text-center font-semibold" title={equipment.name}>
                  <span className="line-clamp-2">{equipment.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-t-line">
                <th className="sticky left-0 z-10 bg-card px-4 py-2 text-left font-medium text-app">
                  <Link to={`/cadastro/colaboradores/${member.id}/matriz`} className="hover:text-accent hover:underline">
                    {member.name}
                  </Link>
                  <span className="block text-xs font-normal text-muted">{shiftName(member.shift)}</span>
                </th>
                {team.equipments.map((equipment) => {
                  const cell = member.cells.find((item) => item.equipmentId === equipment.id);
                  return (
                    <td key={equipment.id} className="px-1 py-1 text-center">
                      {cell ? (
                        <span
                          className={`block rounded-control px-2 py-1.5 font-semibold tabular-nums ${cellClass(cell.adherence, cell.scored, team.qualifiedAdherence)}`}
                          title={`${cell.scored} de ${cell.applicable} avaliadas, ${cell.below} abaixo do esperado`}
                        >
                          {cell.adherence === null ? "—" : `${cell.adherence}%`}
                        </span>
                      ) : (
                        <span className="text-muted" title="Equipamento não marcado na matriz do técnico">
                          ·
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {members.length === 0 ? (
              <tr>
                <td colSpan={team.equipments.length + 1} className="px-4 py-4 text-sm text-muted">
                  Nenhum técnico ativo neste turno.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-t-line">
              <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-muted">Qualificados / mínimo</th>
              {team.equipments.map((equipment) => (
                <td key={equipment.id} className="px-1 py-2 text-center">
                  <span className={`inline-block ${statusChipClass(equipment.status)}`} title={coverageLabel[equipment.status]}>
                    {equipment.qualified}
                    {equipment.minQualified ? ` / ${equipment.minQualified}` : ""}
                  </span>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

export function TeamMatrixPage() {
  const team = useTeamMatrix();
  const [shift, setShift] = useState("");
  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow="Equipe"
        title="Matriz da equipe"
        text={`Aderência de cada técnico por equipamento. Qualificado é aderência de ${team.data?.qualifiedAdherence ?? 80}% ou mais.`}
        action={
          <div className="flex flex-wrap items-end gap-3">
            <Link to="/configuracoes/avaliacao" className="text-sm font-medium text-accent hover:underline">
              Ajustar o corte e o mínimo por equipamento (Configurações › Avaliação)
            </Link>
            <Field label="Turno">
              <SelectInput value={shift} onChange={(event) => setShift(event.target.value)}>
                <option value="">Todos</option>
                {MEMBER_SHIFTS.map((item) => (
                  <option key={item} value={item}>
                    {MEMBER_SHIFT_LABELS[item]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        }
      />
      {team.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {team.isError ? <Notice>{errorMessage(team.error)}</Notice> : null}
      {team.data ? (
        <>
          <Alerts team={team.data} />
          <Heatmap team={team.data} shift={shift} />
          {team.data.equipments.some((equipment) => Object.keys(equipment.qualifiedByShift).length > 0) ? (
            <Card>
              <h2 className="text-sm font-semibold text-app">Qualificados por turno</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-app">
                {team.data.equipments
                  .filter((equipment) => Object.keys(equipment.qualifiedByShift).length > 0)
                  .map((equipment) => (
                    <li key={equipment.id}>
                      <span className="font-medium">{equipment.name}</span>
                      <span className="text-muted">
                        {" · "}
                        {Object.entries(equipment.qualifiedByShift)
                          .map(([key, count]) => `${shiftName(key)}: ${count}`)
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
