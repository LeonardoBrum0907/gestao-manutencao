import { useState } from "react";
import { Link } from "react-router-dom";
import { MEMBER_SHIFTS, MEMBER_SHIFT_LABELS, type MemberShift, type TeamMatrixDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { useTeamMatrix } from "../data/matrix";
import { alertGroups, cellClass, coverageLabel, coverageTextClass, qualifiedMembers, statusChipClass } from "../model/team";
import { ScoreStack, StackLegend, stackTitle } from "./ScoreStack";

function shiftName(shift: string): string {
  return MEMBER_SHIFT_LABELS[shift as MemberShift] ?? shift;
}

function Alerts({ team }: { team: TeamMatrixDto }) {
  const groups = alertGroups(team);
  const late = team.members.filter((member) => member.pdiOverdue > 0);
  if (groups.length === 0 && late.length === 0) {
    return <Card compact className="text-sm text-muted">Nenhum alerta: todos os equipamentos estão cobertos e sem PDI atrasado.</Card>;
  }
  return (
    <Card compact>
      <h2 className="sr-only">Alertas</h2>
      <ul className="flex flex-col gap-2 text-sm">
        {groups.map((group) => (
          <li key={group.status} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className={`shrink-0 ${statusChipClass(group.status)}`}>
              {coverageLabel[group.status]} · {group.equipments.length}
            </span>
            <span className="min-w-0 text-app">
              {group.equipments
                .map((equipment) => {
                  const names = qualifiedMembers(team, equipment.id).map((member) => member.name);
                  return group.status === "single" && names.length ? `${equipment.name} (só ${names[0]})` : equipment.name;
                })
                .join(" · ")}
            </span>
          </li>
        ))}
        {late.length ? (
          <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="shrink-0 rounded-control bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">PDI atrasado · {late.length}</span>
            <span className="min-w-0">
              {late.map((member, index) => (
                <span key={member.id}>
                  {index ? " · " : ""}
                  <Link to={`/cadastro/colaboradores/${member.id}/pdi`} className="font-medium text-accent hover:underline">
                    {member.name}
                  </Link>
                  <span className="text-muted"> ({member.pdiOverdue})</span>
                </span>
              ))}
            </span>
          </li>
        ) : null}
      </ul>
    </Card>
  );
}

function Heatmap({ team, shift, onShift }: { team: TeamMatrixDto; shift: string; onShift: (shift: string) => void }) {
  const members = team.members.filter((member) => !shift || member.shift === shift);
  return (
    <Card compact className="overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-4 py-2.5">
        <StackLegend />
        <div className="w-44">
          <SelectInput aria-label="Turno" value={shift} onChange={(event) => onShift(event.target.value)}>
            <option value="">Todos os turnos</option>
            {MEMBER_SHIFTS.map((item) => (
              <option key={item} value={item}>
                {MEMBER_SHIFT_LABELS[item]}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.06em] text-muted">
            <tr>
              <th className="sticky left-0 z-10 bg-card px-4 py-3 font-semibold">Técnico</th>
              {team.equipments.map((equipment) => (
                <th key={equipment.id} className="min-w-28 px-2 py-3 text-center align-bottom font-semibold">
                  <span className="line-clamp-2" title={equipment.name}>
                    {equipment.name}
                  </span>
                  <span
                    className={`mt-1 block text-[11px] normal-case tracking-normal tabular-nums ${coverageTextClass(equipment.status)}`}
                    title={`${coverageLabel[equipment.status]}: ${equipment.qualified} qualificado(s)${equipment.minQualified ? ` de ${equipment.minQualified} necessário(s)` : ""}`}
                  >
                    {equipment.status === "none" || equipment.status === "short" ? "● " : ""}
                    {equipment.qualified}
                    {equipment.minQualified ? ` / ${equipment.minQualified}` : ""}
                    <span className="sr-only"> qualificados, {coverageLabel[equipment.status]}</span>
                  </span>
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
                        <Link
                          to={`/cadastro/colaboradores/${member.id}/matriz?equipamento=${encodeURIComponent(equipment.id)}`}
                          aria-label={`${member.name} em ${equipment.name}: ${cell.adherence === null ? "sem nota" : `${cell.adherence}%`}, ${stackTitle(cell)}`}
                          title={stackTitle(cell)}
                          className={`flex flex-col gap-1.5 rounded-control px-2 py-1.5 font-semibold tabular-nums transition hover:ring-2 hover:ring-inset hover:ring-accent ${cellClass(cell.adherence, cell.scored, team.qualifiedAdherence)}`}
                        >
                          {cell.adherence === null ? "—" : `${cell.adherence}%`}
                          <ScoreStack counts={cell} className="w-full !h-1.5" />
                        </Link>
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
        </table>
      </div>
    </Card>
  );
}

export function TeamMatrixPage() {
  const team = useTeamMatrix();
  const [shift, setShift] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <PageTitle
        eyebrow="Equipe"
        title="Matriz da equipe"
        text={`Aderência de cada técnico por equipamento. Qualificado é aderência de ${team.data?.qualifiedAdherence ?? 80}% ou mais.`}
        action={
          <Link to="/configuracoes/avaliacao" className="text-sm font-medium text-accent hover:underline">
            Ajustar o corte e o mínimo por equipamento
          </Link>
        }
      />
      {team.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {team.isError ? <Notice>{errorMessage(team.error)}</Notice> : null}
      {team.data ? (
        <>
          <Alerts team={team.data} />
          <Heatmap team={team.data} shift={shift} onShift={setShift} />
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
