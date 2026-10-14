// Barra do repassado: trilho neutro e o quanto já passou na cor de destaque.
export function TransferBar({ percent, className = "w-24" }: { percent: number | null; className?: string }) {
  const width = Math.max(0, Math.min(100, percent ?? 0));
  return (
    <span className={`block h-2 overflow-hidden rounded-full bg-chip ${className}`} aria-hidden="true">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
    </span>
  );
}
