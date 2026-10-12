export function AttentionChip({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">Ponto ativo</span>
  ) : (
    <span className="rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted">Ponto desligado</span>
  );
}
