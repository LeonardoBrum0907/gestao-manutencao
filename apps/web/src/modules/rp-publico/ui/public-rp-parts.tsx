import { useState, type ReactNode } from "react";
import { Button, Field, Modal, TextArea } from "../../../design/ui/controls";
import { formatRpDay } from "../../rp/model/rp";
import type { NotePrompt } from "../model/public-rp-review";

type NoteDialogProps = { prompt: NotePrompt; pending: boolean; onClose: () => void; onConfirm: (note: string) => void };

/**
 * Caixa que pede o texto de recusar ou de pedir revisão antes de gravar.
 * @example <NoteDialog prompt={NOTE_PROMPTS.reject} pending={false} onClose={fechar} onConfirm={(note) => recusar(note)} />
 */
export function NoteDialog({ prompt, pending, onClose, onConfirm }: NoteDialogProps) {
  const [note, setNote] = useState("");
  const missing = prompt.required && !note.trim();
  return (
    <Modal open title={prompt.title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label={prompt.label}>
          <TextArea autoFocus value={note} placeholder={prompt.placeholder} onChange={(event) => setNote(event.target.value)} />
        </Field>
        <div className="flex flex-wrap justify-end gap-3">
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={missing || pending} onClick={() => onConfirm(note.trim())}>
            {pending ? "Gravando…" : prompt.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
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
 * Copia um texto (endereço ou o RP) para mandar no WhatsApp. Sem permissão de área de transferência, devolve false.
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
