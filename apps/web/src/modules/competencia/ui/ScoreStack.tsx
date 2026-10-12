// Barrinha acima / igual / abaixo do esperado. O que falta para 100% é o que está sem nota.
export type StackCounts = { above: number; exact: number; below: number; applicable: number };

export function stackTitle({ above, exact, below, applicable }: StackCounts): string {
  const unscored = Math.max(0, applicable - above - exact - below);
  return `${above} acima, ${exact} igual, ${below} abaixo do esperado, ${unscored} sem nota`;
}

const stackParts = [
  { key: "above", fill: "bg-level-above" },
  { key: "exact", fill: "bg-level-equal" },
  { key: "below", fill: "bg-level-below" },
] as const;

// Pedaços por flex-grow (não por largura em %) para o respiro de 2px entre eles caber sem cortar o último;
// pedaço vazio não entra, senão sobra um respiro solto. O "sem nota" é o trilho que aparece no fim.
export function ScoreStack({ counts, className = "w-24" }: { counts: StackCounts; className?: string }) {
  const unscored = Math.max(0, counts.applicable - counts.above - counts.exact - counts.below);
  const parts = [...stackParts.map((part) => ({ ...part, value: counts[part.key] })), { key: "unscored", fill: "", value: unscored }];
  return (
    <span className={`flex h-2.5 shrink-0 gap-[2px] overflow-hidden rounded-full bg-chip ${className}`} aria-hidden="true">
      {parts.filter((part) => part.value > 0).map((part) => (
        <span key={part.key} className={`h-full ${part.fill}`} style={{ flex: `${part.value} 1 0` }} />
      ))}
    </span>
  );
}

const legend = [
  { key: "above", label: "acima", dot: "bg-level-above" },
  { key: "exact", label: "igual", dot: "bg-level-equal" },
  { key: "below", label: "abaixo", dot: "bg-level-below" },
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
