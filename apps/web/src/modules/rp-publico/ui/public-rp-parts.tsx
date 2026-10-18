import type { ReactNode } from "react";
import { formatRpDay } from "../../rp/model/rp";

/**
 * Selo "Revisar" de RP com pedido de revisão em aberto.
 * @example {rp.reviewRequested ? <ReviewBadge /> : null}
 */
export function ReviewBadge() {
  return <span className="rounded-control bg-warn-soft px-2 py-1 text-xs font-semibold text-warn">Revisar</span>;
}

/**
 * Caixa com o pedido de revisão do supervisor.
 * @example <ReviewRequestNotice text={rp.reviewRequest} at={rp.reviewRequestedAt} />
 */
export function ReviewRequestNotice({ text, at, children }: { text: string; at: string | null; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col gap-2 rounded-control border border-warn bg-warn-soft p-4 text-sm text-app">
      <p className="font-semibold text-warn">Revisão pedida{at ? ` em ${formatRpDay(at)}` : ""}</p>
      <p className="whitespace-pre-line">{text}</p>
      {children}
    </div>
  );
}

/**
 * Copia o endereço para mandar no WhatsApp. Sem permissão de área de transferência, devolve false.
 * @example if (!(await copyText(url))) mostrarEndereco(url)
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * O armazenamento do aparelho, ou null quando o navegador bloqueia (aba anônima, dados bloqueados).
 * @example rememberedMember(deviceStorage())
 */
export function deviceStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
