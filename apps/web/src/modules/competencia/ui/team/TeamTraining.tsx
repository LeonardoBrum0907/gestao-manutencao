import type { TeamMatrixDto } from "@manutencao/shared";
import { Link } from "react-router-dom";
import { Card } from "../../../../design/ui/controls";
import { coverageLabel } from "../../model/team";
import { trainingNeeds } from "../../model/team-insights";
import { shiftLabel } from "../../model/team-rows";
import { coverageChipClass } from "./TeamGridHead";

// Visão de treino: para cada equipamento em risco, quem está mais perto do corte. O nome abre o PDI do técnico.
export function TeamTraining({ team }: { team: TeamMatrixDto }) {
  const needs = trainingNeeds(team);
  if (!needs.length) return <Card compact className="text-sm text-muted">Nenhum equipamento em risco: todos têm o mínimo de qualificados.</Card>;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="team-training-title">
      <div>
        <h2 id="team-training-title" className="text-base font-semibold text-app">
          Quem treinar primeiro
        </h2>
        <p className="text-sm text-muted">Para cada equipamento em risco, os técnicos mais perto do corte de {team.qualifiedAdherence}%.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {needs.map((need) => (
          <Card key={need.equipmentId} compact className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-app">{need.name}</h3>
              <span className={`rounded-full px-2 py-px text-[11px] font-semibold tabular-nums ${coverageChipClass[need.status]}`}>
                {coverageLabel[need.status]} · {need.qualified}
                {need.minQualified ? ` / ${need.minQualified}` : ""}
              </span>
            </div>
            {need.candidates.length ? (
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
                {need.candidates.map((candidate) => (
                  <li key={candidate.memberId}>
                    <Link to={`/cadastro/colaboradores/${candidate.memberId}/pdi`} className="font-medium text-app hover:text-accent hover:underline">
                      {candidate.name}
                    </Link>
                    <span className="text-muted tabular-nums">
                      {" "}
                      {candidate.adherence}% · falta {candidate.gap} pts · {shiftLabel(candidate.shift)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">Ninguém tem este equipamento na matriz ainda.</p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}
