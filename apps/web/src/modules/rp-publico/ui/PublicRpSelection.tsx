import { useState, type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { PublicRpDirectoryDto, PublicRpListItemDto, RpBulkAction, RpPublicDecision, RpStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { formatRpDay, rpStatusChipClass, todayLocal } from "../../rp/model/rp";
import { fetchPublicRps, useBulkReview } from "../data/public-rp";
import { downloadRpExport } from "../data/public-rp-xlsx";
import { placeOf, publicRpPath } from "../model/public-rp";
import { rpExportFileName, rpExportTable } from "../model/public-rp-export";
import { bulkDoneText, decisionBadgeClass, decisionBadgeText, machineStatusText, NOTE_PROMPTS } from "../model/public-rp-review";
import { NoteDialog } from "./public-rp-parts";
import { useLongPress } from "./use-long-press";

/**
 * Os dois selos do RP: a avaliação do supervisor sobre o relatório e o status da falha na máquina.
 * @example <RpBadges decision={rp.decision} status={rp.status} />
 */
export function RpBadges({ decision, status }: { decision: RpPublicDecision; status: RpStatus }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={decisionBadgeClass(decision)}>{decisionBadgeText(decision)}</span>
      <span className={rpStatusChipClass(status)}>{machineStatusText(status)}</span>
    </span>
  );
}

type RpListCardProps = {
  code: string;
  rp: PublicRpListItemDto;
  lineNames: ReadonlyMap<string, string>;
  checked: boolean;
  selecting: boolean;
  onToggle: () => void;
  onHold: () => void;
};

/**
 * Cartão da lista. No computador a caixinha fica sempre à esquerda; no celular ela só aparece depois de tocar e segurar
 * um RP, como na galeria (pedido do Léo: não ocupar espaço). Com algum RP marcado, tocar no cartão marca em vez de abrir.
 * `onHold` começa a seleção por arrasto (useDragSelect).
 * @example <RpListCard code={code} rp={rp} lineNames={names} checked={selected.has(rp.id)} selecting={selected.size > 0} onToggle={…} onHold={…} />
 */
export function RpListCard({ code, rp, lineNames, checked, selecting, onToggle, onHold }: RpListCardProps) {
  const longPress = useLongPress(onHold);
  const border = checked ? "border-accent" : "border-line";
  function toggleInsteadOfOpening(event: MouseEvent) {
    if (!selecting) return;
    event.preventDefault();
    onToggle();
  }
  return (
    <li data-rp-id={rp.id} className={`flex rounded-card border ${border} bg-card shadow-card transition hover:border-accent`}>
      <label className={`${selecting ? "flex" : "hidden sm:flex"} cursor-pointer items-start py-4 pl-4 pr-1`}>
        <input type="checkbox" aria-label={`Marcar RP: ${rp.problem}`} className="h-5 w-5 accent-[var(--accent)]" checked={checked} onChange={onToggle} />
      </label>
      <Link
        to={publicRpPath(code, rp.id)}
        {...longPress}
        onClick={toggleInsteadOfOpening}
        className={`flex min-w-0 flex-1 select-none flex-col gap-1.5 p-4 [-webkit-touch-callout:none] ${selecting ? "pl-3" : "sm:pl-3"}`}
      >
        <span className="text-xs text-muted">{[formatRpDay(rp.occurredAt), ...placeOf(rp, lineNames)].join(" · ")}</span>
        <RpBadges decision={rp.decision} status={rp.status} />
        <span className="line-clamp-2 text-sm text-app">{rp.problem}</span>
        <span className="text-xs text-muted">{rp.memberNames.join(", ") || "Sem técnico"}</span>
      </Link>
    </li>
  );
}

function selectedText(count: number): string {
  return count === 1 ? "1 selecionado" : `${count} selecionados`;
}

function StickyBar({ children }: { children: ReactNode }) {
  return (
    <div data-selection-bar className="sticky bottom-0 -mx-4 border-t border-line bg-surface px-4 py-3">
      {children}
    </div>
  );
}

type ReviewBarProps = { code: string; selected: ReadonlySet<string>; onClear: () => void };

/**
 * Barra que aparece no pé quando há RP marcado: aprovar, recusar ou pedir revisão de todos de uma vez.
 * @example {selected.size ? <ReviewBar code={code} selected={selected} onClear={limpar} /> : null}
 */
export function ReviewBar({ code, selected, onClear }: ReviewBarProps) {
  const review = useBulkReview(code);
  const toast = useToast();
  const [asking, setAsking] = useState<Exclude<RpBulkAction, "approve"> | null>(null);
  const ids = [...selected];

  function apply(action: RpBulkAction, note?: string) {
    review.mutate(
      { ids, action, note },
      {
        onSuccess: (result) => {
          toast({ text: bulkDoneText(action, result.updated) });
          setAsking(null);
          onClear();
        },
        onError: (error) => toast({ text: `Não deu para gravar: ${errorMessage(error)}` }),
      },
    );
  }

  return (
    <StickyBar>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-app">{selectedText(ids.length)}</span>
        <button type="button" className="font-semibold text-accent hover:underline" onClick={onClear}>
          Limpar
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button disabled={review.isPending} onClick={() => apply("approve")}>Aprovar</Button>
        <Button tone="ghost" disabled={review.isPending} onClick={() => setAsking("reject")}>Recusar</Button>
        <Button tone="ghost" disabled={review.isPending} onClick={() => setAsking("request_review")}>Pedir revisão</Button>
      </div>
      {asking ? (
        <NoteDialog prompt={NOTE_PROMPTS[asking]} pending={review.isPending} onClose={() => setAsking(null)} onConfirm={(note) => apply(asking, note)} />
      ) : null}
    </StickyBar>
  );
}

type ExportIntroProps = { shown: number; selected: number; onSelectAll: () => void; onClear: () => void; onCancel: () => void };

/**
 * Cabeçalho da exportação: diz que a lista mostra só os aprovados e dá o atalho de marcar todos.
 * @example <ExportIntro shown={items.length} selected={marcados} onSelectAll={…} onClear={…} onCancel={sair} />
 */
export function ExportIntro({ shown, selected, onSelectAll, onClear, onCancel }: ExportIntroProps) {
  const allMarked = shown > 0 && selected === shown;
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-app">
          <span className="font-semibold">Exportar planilha.</span> Aparecem só os RPs aprovados. Marque os que vão para a planilha e
          baixe embaixo.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button tone="ghost" onClick={allMarked ? onClear : onSelectAll} disabled={!shown}>
            {allMarked ? "Desmarcar todos" : `Marcar todos (${shown})`}
          </Button>
          <Button tone="ghost" onClick={onCancel}>
            Voltar para a lista
          </Button>
        </div>
      </div>
    </Card>
  );
}

// A lista só traz o resumo: busca a ficha de cada marcado e confere de novo que está aprovado.
function useExportApproved(code: string, directory: PublicRpDirectoryDto | undefined) {
  const client = useQueryClient();
  const toast = useToast();
  return async (ids: string[]) => {
    if (!directory) return;
    const approved = (await fetchPublicRps(client, code, ids)).filter((rp) => rp.approved);
    if (!approved.length) return toast({ text: "Nenhum dos marcados está aprovado. Aprove antes de exportar." });
    await downloadRpExport(rpExportTable(approved, directory), rpExportFileName(todayLocal()));
    toast({ text: `Planilha com ${approved.length} RP${approved.length === 1 ? "" : "s"} baixada.` });
  };
}

type ExportBarProps = { code: string; selected: ReadonlySet<string>; directory: PublicRpDirectoryDto | undefined };

/**
 * Barra da exportação: quantos estão marcados e o botão de baixar a planilha.
 * @example <ExportBar code={code} selected={selected} directory={directory.data} />
 */
export function ExportBar({ code, selected, directory }: ExportBarProps) {
  const exportApproved = useExportApproved(code, directory);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const ids = [...selected];

  async function exportSelected() {
    setBusy(true);
    await exportApproved(ids).catch((error: unknown) => toast({ text: `Não deu para exportar: ${errorMessage(error)}` }));
    setBusy(false);
  }

  return (
    <StickyBar>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-app">{ids.length ? selectedText(ids.length) : "Nenhum selecionado"}</span>
        <Button disabled={!ids.length || busy || !directory} onClick={() => void exportSelected()}>
          {busy ? "Baixando…" : "Baixar planilha"}
        </Button>
      </div>
    </StickyBar>
  );
}
