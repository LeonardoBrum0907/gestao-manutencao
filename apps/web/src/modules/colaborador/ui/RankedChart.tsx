import { QUARTERS, type MemberPerformanceDto } from "@manutencao/shared";
import { formatScore, rankedAverages, scoreBand } from "../model/performance";

export const BAND_CLASS = {
  high: "bg-green-600",
  good: "bg-lime-500",
  mid: "bg-amber-500",
  low: "bg-red-600",
} as const;

const BAND_LEGEND = [
  { band: "high", label: "9 a 10" },
  { band: "good", label: "7 a 8" },
  { band: "mid", label: "5 a 6" },
  { band: "low", label: "até 4" },
] as const;

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  if (value === 0) return <span className="text-muted">= 0</span>;
  return value > 0 ? (
    <span className="font-semibold text-green-600">▲ +{value}</span>
  ) : (
    <span className="font-semibold text-red-600">▼ {value}</span>
  );
}

// Uma linha por competência: barra da média (com a meta marcada), um ponto por trimestre e a variação do último.
export function RankedChart({ performance, target }: { performance: MemberPerformanceDto; target: number }) {
  const rows = rankedAverages(performance);
  if (!rows.length) return <p className="text-sm text-muted">O gráfico aparece quando houver nota.</p>;
  const best = rows[0]!.competencyId;
  const worst = rows.length > 1 ? rows[rows.length - 1]!.competencyId : null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {BAND_LEGEND.map((item) => (
          <span key={item.band} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${BAND_CLASS[item.band]}`} />
            {item.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-muted" />
          meta {target}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted" />
          sem nota
        </span>
      </div>
      <div className="hidden grid-cols-[11rem_minmax(0,1fr)_9.5rem_3rem_3.5rem] items-end gap-3 border-b border-b-line pb-1 text-xs text-muted sm:grid">
        <span>Competência</span>
        <span>Média</span>
        <span className="grid grid-cols-4 text-center">
          {QUARTERS.map((quarter) => (
            <span key={quarter}>{quarter}º tri</span>
          ))}
        </span>
        <span className="text-right">Média</span>
        <span className="text-right">Δ último</span>
      </div>
      <ol>
        {rows.map((row) => {
          const tone = row.competencyId === best ? "bg-green-500/10" : row.competencyId === worst ? "bg-red-500/10" : "";
          const summary = QUARTERS.map((quarter, i) => `${quarter}º tri ${row.scores[i] ?? "sem nota"}`).join(", ");
          return (
            <li
              key={row.competencyId}
              tabIndex={0}
              aria-label={`${row.name}: média ${formatScore(row.average)}. ${summary}.`}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-b-line px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[11rem_minmax(0,1fr)_9.5rem_3rem_3.5rem] ${tone}`}
            >
              <span className="truncate text-sm text-app">{row.name}</span>
              <span className="order-2 text-right text-sm font-semibold tabular-nums text-app sm:hidden">
                {formatScore(row.average)}
              </span>
              <span className="relative order-3 col-span-2 block h-2 rounded-full bg-line sm:order-none sm:col-span-1">
                <span className="block h-full rounded-full bg-chart opacity-70" style={{ width: `${(row.average / 10) * 100}%` }} />
                <span
                  className="absolute -top-1 -bottom-1 w-0.5 bg-muted"
                  style={{ left: `${target * 10}%` }}
                  aria-hidden
                />
              </span>
              <span className="relative order-4 col-span-2 grid h-5 grid-cols-4 items-center justify-items-center sm:order-none sm:col-span-1">
                <span className="absolute inset-x-[12.5%] top-1/2 h-0.5 -translate-y-1/2 bg-line" aria-hidden />
                {row.scores.map((value, i) =>
                  value === null ? (
                    <span key={i} title={`${QUARTERS[i]}º tri: sem nota`} className="relative h-3 w-3 rounded-full border border-dashed border-muted bg-surface" />
                  ) : (
                    <span
                      key={i}
                      title={`${QUARTERS[i]}º tri: ${value}`}
                      className={`relative h-3 w-3 rounded-full ${BAND_CLASS[scoreBand(value)]}`}
                    />
                  ),
                )}
              </span>
              <span className="hidden text-right text-sm font-semibold tabular-nums text-app sm:block">{formatScore(row.average)}</span>
              <span className="hidden text-right text-xs tabular-nums sm:block">
                <Delta value={row.delta} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
