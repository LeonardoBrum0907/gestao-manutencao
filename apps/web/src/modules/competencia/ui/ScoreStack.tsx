// Barrinha acima / igual / abaixo do esperado. O que falta para 100% é o que está sem nota.
export type StackCounts = { above: number; exact: number; below: number; applicable: number };

export function stackTitle({ above, exact, below, applicable }: StackCounts): string {
  const unscored = Math.max(0, applicable - above - exact - below);
  return `${above} acima, ${exact} igual, ${below} abaixo do esperado, ${unscored} sem nota`;
}

export function ScoreStack({ counts, className = "w-24" }: { counts: StackCounts; className?: string }) {
  const total = counts.applicable || 1;
  const part = (value: number) => ({ width: `${(value / total) * 100}%` });
  return (
    <span className={`flex h-2 shrink-0 overflow-hidden rounded-full bg-chip ${className}`} aria-hidden="true">
      <span className="h-full bg-accent" style={part(counts.above)} />
      <span className="h-full bg-equal" style={part(counts.exact)} />
      <span className="h-full bg-danger" style={part(counts.below)} />
    </span>
  );
}

const legend = [
  { key: "above", label: "acima", dot: "bg-accent" },
  { key: "exact", label: "igual", dot: "bg-equal" },
  { key: "below", label: "abaixo", dot: "bg-danger" },
] as const;

// Legenda das cores; com counts, mostra também quantas de cada.
export function StackLegend({ counts }: { counts?: StackCounts }) {
  const unscored = counts ? Math.max(0, counts.applicable - counts.above - counts.exact - counts.below) : null;
  return (
    <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-muted">
      {legend.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-[3px] ${item.dot}`} aria-hidden="true" />
          {counts ? <span className="tabular-nums">{counts[item.key]}</span> : null} {item.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-[3px] border border-line bg-chip" aria-hidden="true" />
        {unscored !== null ? <span className="tabular-nums">{unscored}</span> : null} sem nota
      </span>
    </span>
  );
}
