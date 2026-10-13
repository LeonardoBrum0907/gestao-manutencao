import type { TransferPointDto } from "@manutencao/shared";
import { shortDate } from "../model/transfer-view";

const WIDTH = 320;
const HEIGHT = 120;
const LEFT = 36;
const TOP = 8;
const BOTTOM = 100;

function dayLabel(date: string): string {
  return shortDate(`${date}T12:00:00Z`).slice(0, 5);
}

// Curva do repassado de 0 a 100%: início, cada mês e hoje.
export function EvolutionChart({ points }: { points: TransferPointDto[] }) {
  const y = (percent: number) => BOTTOM - (percent / 100) * (BOTTOM - TOP);
  const x = (index: number) => LEFT + (index * (WIDTH - LEFT - 10)) / Math.max(1, points.length - 1);
  const path = points.map((point, index) => `${x(index)},${y(point.percent)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Evolução do repassado">
      {[0, 50, 100].map((tick) => (
        <g key={tick}>
          <line x1={LEFT} x2={WIDTH} y1={y(tick)} y2={y(tick)} className="stroke-line" strokeWidth={1} />
          <text x={LEFT - 6} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[10px]">
            {tick}%
          </text>
        </g>
      ))}
      <polyline points={path} fill="none" className="stroke-accent" strokeWidth={2} />
      {points.map((point, index) => (
        <circle key={point.date} cx={x(index)} cy={y(point.percent)} r={3} className="fill-accent">
          <title>{`${dayLabel(point.date)}: ${point.percent}%`}</title>
        </circle>
      ))}
      {[0, points.length - 1].map((index) => (
        <text key={index} x={x(index)} y={BOTTOM + 15} textAnchor={index === 0 ? "start" : "end"} className="fill-muted text-[10px]">
          {dayLabel(points[index]?.date ?? "")}
        </text>
      ))}
    </svg>
  );
}
