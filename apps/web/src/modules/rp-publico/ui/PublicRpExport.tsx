import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { PublicRpDirectoryDto, PublicRpListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { formatRpDay, rpStatusChipClass, rpStatusLabel, todayLocal } from "../../rp/model/rp";
import { fetchPublicRps } from "../data/public-rp";
import { downloadRpExport } from "../data/public-rp-xlsx";
import { placeOf } from "../model/public-rp";
import { rpExportFileName, rpExportTable } from "../model/public-rp-export";

/**
 * Selo "Aprovado": o coordenador conferiu o RP no app e ele pode ir para a planilha.
 * @example {rp.approved ? <ApprovedBadge /> : null}
 */
export function ApprovedBadge() {
  return <span className="rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent-ink">Aprovado</span>;
}

type SelectableCardProps = { rp: PublicRpListItemDto; lineNames: ReadonlyMap<string, string>; checked: boolean; onToggle: () => void };

/**
 * Cartão do RP no modo de exportar: o toque marca ou desmarca, em vez de abrir o RP.
 * @example <SelectableRpCard rp={rp} lineNames={names} checked={selected.has(rp.id)} onToggle={() => toggle(rp.id)} />
 */
export function SelectableRpCard({ rp, lineNames, checked, onToggle }: SelectableCardProps) {
  const border = checked ? "border-accent" : "border-line";
  return (
    <li>
      <label className={`flex cursor-pointer gap-3 rounded-card border ${border} bg-card p-4 shadow-card transition hover:border-accent`}>
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" checked={checked} onChange={onToggle} />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{[formatRpDay(rp.occurredAt), ...placeOf(rp, lineNames)].join(" · ")}</span>
            <span className={rpStatusChipClass(rp.status)}>{rpStatusLabel(rp.status)}</span>
          </span>
          <span className="line-clamp-2 text-sm text-app">{rp.problem}</span>
          <span className="text-xs text-muted">{rp.memberNames.join(", ") || "Sem técnico"}</span>
        </span>
      </label>
    </li>
  );
}

type ExportIntroProps = { shown: number; selected: number; onSelectAll: () => void; onClear: () => void; onCancel: () => void };

/**
 * Cabeçalho do modo de exportar: explica que só aparecem os aprovados e oferece marcar todos.
 * @example <ExportIntro shown={items.length} selected={selected.size} onSelectAll={…} onClear={…} onCancel={…} />
 */
export function ExportIntro({ shown, selected, onSelectAll, onClear, onCancel }: ExportIntroProps) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-app">
          <span className="font-semibold">Exportar planilha.</span> Aparecem só os RPs aprovados pelo coordenador. Marque os que vão para a
          planilha.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button tone="ghost" onClick={selected === shown ? onClear : onSelectAll} disabled={!shown}>
            {selected === shown && shown ? "Desmarcar todos" : `Marcar todos (${shown})`}
          </Button>
          <Button tone="ghost" onClick={onCancel}>
            Sair da exportação
          </Button>
        </div>
      </div>
    </Card>
  );
}

type ExportBarProps = { code: string; selected: ReadonlySet<string>; directory: PublicRpDirectoryDto | undefined };

/**
 * Barra presa no pé da tela com quantos estão marcados e o botão que baixa a planilha.
 * @example <ExportBar code={code} selected={selected} directory={directory.data} />
 */
export function ExportBar({ code, selected, directory }: ExportBarProps) {
  const client = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function exportSelected() {
    if (!directory) return;
    setBusy(true);
    try {
      const rps = await fetchPublicRps(client, code, [...selected]);
      await downloadRpExport(rpExportTable(rps, directory), rpExportFileName(todayLocal()));
      toast({ text: `Planilha com ${rps.length} RP${rps.length === 1 ? "" : "s"} baixada.` });
    } catch (error) {
      toast({ text: `Não deu para exportar: ${errorMessage(error)}` });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-app">{selected.size ? `${selected.size} selecionado${selected.size === 1 ? "" : "s"}` : "Nenhum selecionado"}</span>
        <Button disabled={!selected.size || busy || !directory} onClick={() => void exportSelected()}>
          {busy ? "Exportando…" : "Exportar planilha"}
        </Button>
      </div>
    </div>
  );
}
