import type { RecordListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, PageTitle } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useBoardChange } from "../data/board";
import { useEntries } from "../data/entries";
import { dayLabel, dueDay, todayDay } from "../model/board";
import { CheckRow, ringTone, useCompleting } from "./checklist";
import { ChecklistBox, type ChecklistColumn } from "./checklist-table";
import { InboxAdd } from "./InboxAdd";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink } from "./record-link";

const ENTRY_COLUMNS: ChecklistColumn[] = [{ key: "anotado", header: "Anotado", width: "9rem" }];

function pendingLine(count: number): string {
  if (count === 0) return "Nada para revisar";
  return count === 1 ? "1 rascunho para revisar" : `${count} rascunhos para revisar`;
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
    <div>
      <PageTitle
        title="Entrada"
        text="Anote aqui o que aparecer no turno. Depois, com calma, abra cada rascunho e escolha se é tarefa, problema ou feedback: aí ele vai para Registros."
      />
      <p className="mb-3 hidden justify-end text-sm text-muted md:flex">{pendingLine(items.length)}</p>
      <ChecklistBox frame={{ itemHeader: "Rascunho", columns: ENTRY_COLUMNS, summary: pendingLine(items.length) }}>
        {items.length ? (
          <ul>
            {items.map((item) => {
              const noted = `Anotado ${dayLabel(dueDay(item.occurredAt), today).toLowerCase()}`;
              return (
                <li
                  key={item.id}
                  className={`border-b border-line bg-card transition-colors hover:bg-accent-soft ${fading.has(item.id) ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}
                >
                  <CheckRow
                    checked={fading.has(item.id)}
                    ring={ringTone.plain}
                    label={`Concluir: ${item.body}`}
                    onToggle={() => finish(item)}
                    link={linkOf({ id: item.id, origin: item.origin })}
                    title={item.body}
                    info={<span className="tabular-nums">{noted}</span>}
                    cells={[<span className="tabular-nums text-muted">{dayLabel(dueDay(item.occurredAt), today)}</span>]}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-b border-line px-3 py-4 text-sm text-muted">Nada para revisar. O que você anotar aparece aqui.</p>
        )}
      </ChecklistBox>
      <div className="mt-4">
        <InboxAdd today={today} />
      </div>
      <RecordModalHost />
    </div>
  );
}
