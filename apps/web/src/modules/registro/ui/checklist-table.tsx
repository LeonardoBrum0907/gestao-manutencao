import { createContext, useContext, type CSSProperties, type ReactNode } from "react";

// Moldura do checklist no desenho das listas do app (DataTable): caixa com cabeçalho verde claro,
// faixas de grupo no verde mais escuro e colunas no computador. No celular as colunas viram uma linha
// de informação embaixo do título.

/** Coluna à direita do título. `width` é um tamanho CSS fixo (ex.: "8rem"). */
export type ChecklistColumn = { key: string; header: string; width: string };

export type ChecklistFrame = {
  // Nome da coluna do título ("Tarefa", "Problema"…).
  itemHeader: string;
  columns: ChecklistColumn[];
  // Faixa de cima no celular, onde não há cabeçalho de colunas (ex.: "8 abertas · 2 atrasadas").
  summary?: ReactNode;
};

const FrameContext = createContext<ChecklistColumn[]>([]);

/** As colunas do checklist em volta, para a linha (CheckRow) alinhar as células com o cabeçalho. */
export function useFrameColumns(): ChecklistColumn[] {
  return useContext(FrameContext);
}

// O círculo e o título ocupam as duas primeiras colunas; o resto segue as larguras do cabeçalho.
export function gridStyle(columns: ChecklistColumn[]): CSSProperties {
  const widths = columns.map((column) => column.width).join(" ");
  return { "--checklist-cols": `22px minmax(0,1fr) ${widths}` } as CSSProperties;
}

export const gridClass = "grid grid-cols-[22px_minmax(0,1fr)] gap-x-3 md:[grid-template-columns:var(--checklist-cols)]";

const headText = "text-xs font-semibold uppercase tracking-[0.08em] text-accent-ink";

function FrameHead({ frame }: { frame: ChecklistFrame }) {
  return (
    <>
      <div style={gridStyle(frame.columns)} className={`hidden border-b border-line-strong bg-accent-soft px-3 py-2.5 md:grid ${gridClass} ${headText}`}>
        <span />
        <span>{frame.itemHeader}</span>
        {frame.columns.map((column) => (
          <span key={column.key} className="whitespace-nowrap">
            {column.header}
          </span>
        ))}
      </div>
      {frame.summary ? (
        <div className="border-b border-line-strong bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-ink md:hidden">{frame.summary}</div>
      ) : null}
    </>
  );
}

/**
 * Caixa do checklist com o cabeçalho de colunas.
 * @example
 * <ChecklistBox frame={{ itemHeader: "Tarefa", columns: [{ key: "prazo", header: "Prazo", width: "8rem" }] }}>{grupos}</ChecklistBox>
 */
export function ChecklistBox({ frame, children }: { frame: ChecklistFrame; children: ReactNode }) {
  return (
    <FrameContext.Provider value={frame.columns}>
      <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
        <FrameHead frame={frame} />
        {/* A borda de baixo da última linha some atrás da borda da caixa, sem linha dupla. */}
        <div className="-mb-px">{children}</div>
      </div>
    </FrameContext.Provider>
  );
}

const bandText = "text-[12.5px] font-bold uppercase tracking-[0.07em] text-app";

/** Faixa do grupo: abre e recolhe pelo nome, mostra a contagem e, à direita, uma ação do grupo. */
export function GroupBand({
  title,
  sub,
  count,
  collapsed,
  onFold,
  action,
}: {
  title: string;
  sub?: string;
  count: number;
  collapsed: boolean;
  onFold: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-line-strong bg-group px-3 py-1.5">
      <h2 className="min-w-0">
        <button type="button" onClick={onFold} aria-expanded={!collapsed} className={`-ml-1 flex items-center gap-2 rounded-md px-1 py-0.5 text-left hover:bg-accent-soft ${bandText}`}>
          <svg viewBox="0 0 16 16" aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted transition ${collapsed ? "-rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.25">
            <path d="M4 6l4 4 4-4" />
          </svg>
          <span className="min-w-0">
            {title}
            {sub ? <span className="font-semibold text-muted"> · {sub}</span> : null}
            {count ? <span className="tabular-nums text-muted"> · {count}</span> : null}
          </span>
        </button>
      </h2>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  );
}

/** Linha da caixa que não é item: o "+ Adicionar…" no fim do grupo. */
export function FrameFooter({ children }: { children: ReactNode }) {
  return <div className="border-b border-line px-3">{children}</div>;
}
