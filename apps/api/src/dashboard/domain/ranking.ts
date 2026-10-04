import type { DashboardRankDto } from "@manutencao/shared";

export const RECENT_LIMIT = 5;
export const RANK_LIMIT = 5;

// Os números já vêm somados do banco. Só entra quem ainda existe no cadastro (o vínculo do registro não tem chave estrangeira).
export function rankOpen(counts: { id: string; openCount: number }[], names: Map<string, string>): DashboardRankDto[] {
  return counts
    .filter((row) => names.has(row.id))
    .map((row) => ({ id: row.id, name: names.get(row.id) ?? "", openCount: row.openCount }))
    .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name, "pt-BR") || a.id.localeCompare(b.id))
    .slice(0, RANK_LIMIT);
}
