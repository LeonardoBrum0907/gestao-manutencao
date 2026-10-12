import { niceCeiling, weekLabel } from "../model/overview-format";

export type ColumnSeries = { label: string; fill: string; swatch: string; values: number[] };

const WIDTH = 320;
const HEIGHT = 150;
const LEFT = 26;
const BOTTOM = 126;
const TOP = 10;

// Colunas por semana na mesma escala; com duas séries, lado a lado e com legenda. Passar o mouse mostra o valor.
export function ColumnChart({ weeks, series, label }: { weeks: string[]; series: ColumnSeries[]; label: string }) {
  const top = niceCeiling(Math.max(0, ...series.flatMap((item) => item.values)));
  const y = (value: number) => BOTTOM - (value / top) * (BOTTOM - TOP);
  const step = (WIDTH - LEFT) / weeks.length;
  const barWidth = Math.max(4, (step - 8) / series.length - 2);
  return (
    <div className="flex flex-col gap-2">
      {series.length > 1 ? <Legend series={series} /> : null}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={label}>
        {[0, top / 2, top].map((tick) => (
          <g key={tick}>
            <line x1={LEFT} x2={WIDTH} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth={1} />
            <text x={LEFT - 6} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[10px]">
              {tick}
            </text>
          </g>
        ))}
        {weeks.map((week, index) => (
          <g key={week}>
            {series.map((item, position) => {
              const value = item.values[index] ?? 0;
              const x = LEFT + index * step + 4 + position * (barWidth + 2);
              return (
                <rect key={item.label} x={x} y={y(value)} width={barWidth} height={BOTTOM - y(value)} rx={2} className={item.fill}>
                  <title>{`Semana de ${weekLabel(week)}: ${value} ${item.label.toLowerCase()}`}</title>
                </rect>
              );
            })}
            <text x={LEFT + index * step + step / 2} y={BOTTOM + 15} textAnchor="middle" className="fill-muted text-[10px]">
              {weekLabel(week)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Legend({ series }: { series: ColumnSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {series.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${item.swatch}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
