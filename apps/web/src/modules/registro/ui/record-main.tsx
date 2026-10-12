import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { RecordDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useChamado } from "../../turno/data/shift";
import { chamadoHref, shortDay } from "../../turno/model/chamado";
import { useBoardChange } from "../data/board";
import { useAddAttachment, useRemoveAttachment } from "../data/records";
import { useRecordSave } from "./record-save";

// Coluna principal do modal do registro: círculo e texto no alto, descrição, de onde veio e anexos.

type InlineTextProps = {
  value: string;
  placeholder: string;
  className: string;
  // Título: Enter grava (quebra de linha só com Shift); descrição aceita Enter.
  singleLine?: boolean;
  // Texto obrigatório: apagar tudo e sair do campo volta ao texto gravado.
  required?: boolean;
  onCommit: (value: string) => void;
};

/**
 * Texto editável no lugar, que cresce com o conteúdo. Grava ao sair do campo; Esc desfaz a edição
 * (e não fecha o modal).
 * Ex.: `<InlineText value={record.body} placeholder="Texto" className="text-xl" singleLine onCommit={saveBody} />`
 */
export function InlineText({ value, placeholder, className, singleLine, required, onCommit }: InlineTextProps) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setDraft(value), [value]);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [draft]);

  function commit() {
    if (required && !draft.trim()) return setDraft(value);
    if (draft !== value) onCommit(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(value);
      window.setTimeout(() => ref.current?.blur());
    }
    if (singleLine && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ref.current?.blur();
    }
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
      className={`block w-full resize-none overflow-hidden rounded-md bg-transparent px-1 py-0.5 outline-none placeholder:text-muted focus:bg-surface focus:ring-1 focus:ring-line ${className}`}
    />
  );
}

const ringOf = { high: "border-2 border-danger", medium: "border-2 border-warn", low: "border-[1.5px] border-muted" };

// Círculo de concluir, com a cor da prioridade (como no checklist).
function DoneCircle({ record }: { record: RecordDto }) {
  const change = useBoardChange();
  const toast = useToast();
  const done = record.status === "done";
  const ring = done ? "border-2 border-accent bg-accent text-canvas" : `${ringOf[record.priority ?? "low"]} text-transparent hover:text-muted`;
  const action = record.type === "feedback" ? "conversado" : "concluído";
  function toggle() {
    change.mutate({ id: record.id, change: { status: done ? "open" : "done" } }, { onError: (error) => toast({ text: errorMessage(error) }) });
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={change.isPending}
      aria-label={done ? `Desmarcar ${action}` : `Marcar como ${action}`}
      className={`mt-1.5 grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${ring}`}
    >
      <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2.5 6.2l2.4 2.4 4.6-5" />
      </svg>
    </button>
  );
}

// Tarefa criada por "Gerar pendência" num chamado: mostra de onde veio.
function FromChamado({ chamadoId }: { chamadoId: string }) {
  const chamado = useChamado(chamadoId);
  if (!chamado.data) return null;
  const data = chamado.data;
  return (
    <Link to={chamadoHref(data)} className="block rounded-lg border border-line px-3 py-2 text-sm transition hover:bg-chip">
      <span className="block text-xs font-semibold text-muted">
        Gerada do chamado{data.dayNumber ? ` nº ${data.dayNumber}` : ""} de {shortDay(data.day)}
      </span>
      <span className="mt-0.5 line-clamp-2 block text-app">{data.body}</span>
    </Link>
  );
}

function Attachments({ record }: { record: RecordDto }) {
  const add = useAddAttachment(record.id);
  const remove = useRemoveAttachment(record.id);
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const fail = { onError: (error: Error) => toast({ text: errorMessage(error) }) };
  return (
    <div className="flex flex-col gap-1">
      {record.attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-2 text-sm">
          <Icon name="clip" className="h-4 w-4 text-muted" />
          <a className="min-w-0 truncate text-accent hover:underline" href={`/api/records/${record.id}/attachments/${attachment.id}`}>
            {attachment.fileName}
          </a>
          <button type="button" aria-label={`Remover ${attachment.fileName}`} onClick={() => remove.mutate(attachment.id, fail)} className="ml-auto grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-chip hover:text-danger">
            <Icon name="close" className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => input.current?.click()} disabled={add.isPending} className="inline-flex w-fit items-center gap-2 rounded-md px-1 py-1 text-sm text-muted transition hover:text-app disabled:opacity-50">
        <Icon name="plus" className="h-4 w-4" />
        {add.isPending ? "Anexando…" : "Anexar arquivo"}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) add.mutate(file, fail);
        }}
      />
    </div>
  );
}

/**
 * Coluna principal: círculo, texto e descrição editáveis no lugar; tarefa mostra o chamado de origem e os anexos.
 * Ex.: `<RecordMain record={record} />`
 */
export function RecordMain({ record }: { record: RecordDto }) {
  const save = useRecordSave(record);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <DoneCircle record={record} />
        <InlineText
          value={record.body}
          placeholder="Texto do registro"
          singleLine
          required
          className={`text-xl font-semibold leading-snug ${record.status === "done" ? "text-muted line-through" : "text-app"}`}
          onCommit={(body) => save({ body })}
        />
      </div>
      <div className="flex items-start gap-2 pl-7">
        <Icon name="notes" className="mt-1 h-4 w-4 shrink-0 text-muted" />
        <InlineText value={record.notes ?? ""} placeholder="Descrição" className="text-sm text-app" onCommit={(notes) => save({ notes: notes.trim() || null })} />
      </div>
      {record.chamadoId ? (
        <div className="pl-8">
          <FromChamado chamadoId={record.chamadoId} />
        </div>
      ) : null}
      {record.type === "task" ? (
        <div className="border-t border-line pl-8 pt-3">
          <Attachments record={record} />
        </div>
      ) : null}
    </div>
  );
}
