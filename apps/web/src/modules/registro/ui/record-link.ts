import { useLocation, useNavigate, useSearchParams, type To } from "react-router-dom";
import type { RecordOrigin } from "@manutencao/shared";

// O registro aberto fica no endereço (?registro=id): F5 e o voltar do navegador mantêm o modal.
const PARAM = "registro";

type ModalState = { recordModal: true };

export type RecordLink = { to: To; state?: ModalState; recordId?: string };

function isModalState(state: unknown): state is ModalState {
  return typeof state === "object" && state !== null && "recordModal" in state;
}

/**
 * Link da linha do checklist: registro da Entrada abre no modal por cima da lista; problema de chamado,
 * ocorrência ou RP abre a ficha de origem.
 * Ex.: `const linkOf = useRecordLink(); <CheckRow link={linkOf(item)} … />`
 */
export function useRecordLink(): (item: { id: string; origin: RecordOrigin }) => RecordLink {
  const [params] = useSearchParams();
  return (item) => {
    if (item.origin !== "inbox") return { to: `/registros/${item.id}` };
    const next = new URLSearchParams(params);
    next.set(PARAM, item.id);
    return { to: { search: `?${next}` }, state: { recordModal: true }, recordId: item.id };
  };
}

// Ordem das linhas na tela agora (grupos recolhidos ficam de fora), para as setas do modal.
function visibleRecordIds(): string[] {
  const rows = document.querySelectorAll<HTMLElement>("[data-record-id]");
  return [...new Set([...rows].map((row) => row.dataset.recordId ?? ""))].filter(Boolean);
}

/**
 * Registro aberto no modal e como sair dele. Fechar volta no histórico quando o modal foi aberto pela
 * lista (o voltar do navegador não o reabre); aberto direto pelo endereço, só tira o ?registro.
 * Ex.: `const modal = useRecordModal(); modal.id && <RecordModal id={modal.id} onClose={modal.close} … />`
 */
export function useRecordModal() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = params.get(PARAM);

  function withRecord(recordId: string | null): URLSearchParams {
    const next = new URLSearchParams(params);
    if (recordId) next.set(PARAM, recordId);
    else next.delete(PARAM);
    return next;
  }

  function close() {
    if (isModalState(location.state)) return navigate(-1);
    setParams(withRecord(null), { replace: true });
  }

  // Vizinho na lista (-1 acima, +1 abaixo); nulo no começo, no fim ou quando o registro saiu da lista.
  function neighbor(step: -1 | 1): string | null {
    const ids = visibleRecordIds();
    const index = id ? ids.indexOf(id) : -1;
    if (index < 0) return null;
    return ids[index + step] ?? null;
  }

  function go(recordId: string) {
    setParams(withRecord(recordId), { replace: true, state: location.state });
  }

  return { id, close, neighbor, go };
}
