import type { RecordListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, PageTitle } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useBoardChange } from "../data/board";
import { useEntries } from "../data/entries";
import { dayLabel, dueDay, todayDay } from "../model/board";
import { CheckRow, ringTone, useCompleting } from "./checklist";
import { InboxAdd } from "./InboxAdd";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink } from "./record-link";

function pendingLine(count: number): string {
  if (count === 0) return "Nada para revisar.";
  return count === 1 ? "1 rascunho para revisar." : `${count} rascunhos para revisar.`;
}

/**
 * Entrada: caixa de rascunhos. Anota rápido (tipo Entrada) e, na revisão, o coordenador abre cada um e escolhe se
 * é tarefa, problema ou feedback; aí ele sai daqui e vai para Registros.
 */
export function InboxPage() {
  const entries = useEntries();
  const change = useBoardChange();
  const toast = useToast();
  const linkOf = useRecordLink();
  const { fading, complete } = useCompleting();
  const today = todayDay();

  if (entries.error) return <Notice>{errorMessage(entries.error)}</Notice>;
  if (!entries.data) return <p className="text-sm text-muted">Carregando a Entrada…</p>;
  const items = entries.data;

  // Concluir um rascunho é dar por resolvido sem virar registro (já foi feito, ou não precisa).
  function finish(item: RecordListItemDto) {
    complete(item.id, (done) =>
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () => toast({ text: "Rascunho concluído.", action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: "open" } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Entrada" />
      <p className="-mt-2 mb-4 text-sm text-muted">
        {pendingLine(items.length)} {items.length ? "Abra um e escolha o tipo para mandá-lo a Registros." : ""}
      </p>
      {items.length ? (
        <ul className="border-t border-line">
          {items.map((item) => (
            <li key={item.id} className={`border-b border-line ${fading.has(item.id) ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}>
              <CheckRow
                checked={fading.has(item.id)}
                ring={ringTone.plain}
                label={`Concluir: ${item.body}`}
                onToggle={() => finish(item)}
                link={linkOf({ id: item.id, origin: item.origin })}
                title={item.body}
                info={<span className="tabular-nums">Anotado {dayLabel(dueDay(item.occurredAt), today).toLowerCase()}</span>}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-b border-line pb-4 text-sm text-muted">Anote aqui o que aparecer no turno. Depois, com calma, defina se cada um é tarefa, problema ou feedback.</p>
      )}
      <div className="mt-4">
        <InboxAdd today={today} />
      </div>
      <RecordModalHost />
    </div>
  );
}
