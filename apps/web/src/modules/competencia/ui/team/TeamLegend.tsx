import type { TeamMatrixView } from "@manutencao/shared";
import { NEAR_CUT_GAP } from "../../model/team-insights";
import { StackLegend } from "../ScoreStack";

function Swatch({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-3.5 rounded-[3px] ${className}`} aria-hidden="true" />
      {children}
    </span>
  );
}

// Legenda da grade, conforme a visão. "2 / 3" no cabeçalho é qualificados / mínimo.
export function TeamLegend({ view, cut, draggable }: { view: TeamMatrixView; cut: number; draggable: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {view === "schedule" ? (
        <>
          <span>
            <b className="text-accent">✓</b> qualificado ({cut}% ou mais)
          </span>
          <span>– ainda não</span>
          <span>· não opera</span>
          <span>Linha cinza: quantos qualificados o grupo tem em cada coluna</span>
        </>
      ) : (
        <>
          <Swatch className="bg-accent-soft">{`qualificado (${cut}% ou mais)`}</Swatch>
          {view === "training" ? (
            <Swatch className="bg-warn-soft outline-dashed outline-1 -outline-offset-1 outline-warn">{`perto do corte (${cut - NEAR_CUT_GAP}% a ${cut - 1}%)`}</Swatch>
          ) : null}
          <Swatch className="bg-danger-soft">abaixo do corte</Swatch>
          {view === "training" ? <StackLegend /> : null}
        </>
      )}
      <span>"2 / 3": qualificados / mínimo</span>
      {draggable ? <span>Arraste pela alça ⠿ para trocar a ordem das colunas; clique no nome para ordenar.</span> : <span>Tire os filtros para arrastar colunas.</span>}
    </div>
  );
}
