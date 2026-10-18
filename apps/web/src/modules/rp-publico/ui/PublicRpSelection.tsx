import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RP_PUBLIC_DECISION_LABELS, type PublicRpDirectoryDto, type PublicRpListItemDto, type RpBulkAction, type RpPublicDecision } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { formatRpDay, rpStatusChipClass, rpStatusLabel, todayLocal } from "../../rp/model/rp";
import { fetchPublicRps, useBulkReview } from "../data/public-rp";
import { downloadRpExport } from "../data/public-rp-xlsx";
import { placeOf } from "../model/public-rp";
import { rpExportFileName, rpExportTable } from "../model/public-rp-export";
import { bulkDoneText, decisionBadgeClass, NOTE_PROMPTS } from "../model/public-rp-review";
import { NoteDialog } from "./public-rp-parts";

/**
 * Selo da situação do RP (Aprovado, Recusado, Revisar). Pendente não mostra nada.
 * @example <DecisionBadge decision={rp.decision} />
 */
export function DecisionBadge({ decision }: { decision: RpPublicDecision }) {
  const className = decisionBadgeClass(decision);
  return className ? <span className={className}>{RP_PUBLIC_DECISION_LABELS[decision]}</span> : null;
}

type SelectableCardProps = { rp: PublicRpListItemDto; lineNames: ReadonlyMap<string, string>; checked: boolean; onToggle: () => void };

/**
 * Cartão do RP no modo de seleção: o toque marca ou desmarca, em vez de abrir o RP.
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
            <span className="flex items-center gap-2">
              <DecisionBadge decision={rp.decision} />
              <span className={rpStatusChipClass(rp.status)}>{rpStatusLabel(rp.status)}</span>
            </span>
          </span>
          <span className="line-clamp-2 text-sm text-app">{rp.problem}</span>
          <span className="text-xs text-muted">{rp.memberNames.join(", ") || "Sem técnico"}</span>
        </span>
      </label>
    </li>
  );
}

type SelectionIntroProps = { shown: number; selected: number; onSelectAll: () => void; onClear: () => void; onCancel: () => void };

/**
 * Cabeçalho do modo de seleção: o que dá para fazer e o atalho de marcar todos.
 * @example <SelectionIntro shown={items.length} selected={selected.size} onSelectAll={…} onClear={…} onCancel={…} />
 */
export function SelectionIntro({ shown, selected, onSelectAll, onClear, onCancel }: SelectionIntroProps) {
  const allMarked = shown > 0 && selected === shown;
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-app">
          <span className="font-semibold">Selecionar vários.</span> Marque os RPs e escolha embaixo: aprovar, recusar, pedir revisão ou
          exportar os aprovados para a planilha.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button tone="ghost" onClick={allMarked ? onClear : onSelectAll} disabled={!shown}>
            {allMarked ? "Desmarcar todos" : `Marcar todos (${shown})`}
          </Button>
          <Button tone="ghost" onClick={onCancel}>
            Sair da seleção
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Baixa a planilha só com os aprovados entre os marcados (a lista só traz o resumo: busca a ficha de cada um).
function useExportApproved(code: string, directory: PublicRpDirectoryDto | undefined) {
  const client = useQueryClient();
  const toast = useToast();
  return async (ids: string[]) => {
    if (!directory) return;
    const approved = (await fetchPublicRps(client, code, ids)).filter((rp) => rp.approved);
    if (!approved.length) return toast({ text: "Nenhum dos marcados está aprovado. Aprove antes de exportar." });
    await downloadRpExport(rpExportTable(approved, directory), rpExportFileName(todayLocal()));
    const skipped = ids.length - approved.length;
    toast({ text: `Planilha com ${approved.length} RP${approved.length === 1 ? "" : "s"} baixada.${skipped ? ` ${skipped} sem aprovação ficaram de fora.` : ""}` });
  };
}

type SelectionBarProps = { code: string; selected: ReadonlySet<string>; directory: PublicRpDirectoryDto | undefined; onDone: () => void };

/**
 * Barra presa no pé da tela com quantos estão marcados e as ações em lote.
 * @example <SelectionBar code={code} selected={selected} directory={directory.data} onDone={() => setSelected(new Set())} />
 */
export function SelectionBar({ code, selected, directory, onDone }: SelectionBarProps) {
  const review = useBulkReview(code);
  const exportApproved = useExportApproved(code, directory);
  const toast = useToast();
  const [asking, setAsking] = useState<Exclude<RpBulkAction, "approve"> | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = [...selected];
  const disabled = !ids.length || busy || review.isPending;

  function apply(action: RpBulkAction, note?: string) {
    review.mutate(
      { ids, action, note },
      {
        onSuccess: (result) => {
          toast({ text: bulkDoneText(action, result.updated) });
          setAsking(null);
          onDone();
        },
        onError: (error) => toast({ text: `Não deu para gravar: ${errorMessage(error)}` }),
      },
    );
  }
  async function exportSelected() {
    setBusy(true);
    await exportApproved(ids).catch((error: unknown) => toast({ text: `Não deu para exportar: ${errorMessage(error)}` }));
    setBusy(false);
  }

  return (
    <div className="sticky bottom-0 -mx-4 border-t border-line bg-surface px-4 py-3">
      <p className="mb-2 text-sm text-app">{ids.length ? `${ids.length} selecionado${ids.length === 1 ? "" : "s"}` : "Nenhum selecionado"}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button disabled={disabled} onClick={() => apply("approve")}>Aprovar</Button>
        <Button tone="ghost" disabled={disabled} onClick={() => setAsking("reject")}>Recusar</Button>
        <Button tone="ghost" disabled={disabled} onClick={() => setAsking("request_review")}>Pedir revisão</Button>
        <Button tone="ghost" disabled={disabled || !directory} onClick={() => void exportSelected()}>
          {busy ? "Exportando…" : "Exportar planilha"}
        </Button>
      </div>
      {asking ? (
        <NoteDialog prompt={NOTE_PROMPTS[asking]} pending={review.isPending} onClose={() => setAsking(null)} onConfirm={(note) => apply(asking, note)} />
      ) : null}
    </div>
  );
}
