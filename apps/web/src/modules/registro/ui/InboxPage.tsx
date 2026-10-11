import type { RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, PageTitle } from "../../../design/ui/controls";
import { Icon, type IconName } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { useBoardChange, useFeedbackBoard, useProblemBoard, useTaskBoard } from "../data/board";
import { dueDay, dueLabel } from "../model/board";
import { inboxItems, type InboxItem } from "../model/inbox";
import { recordShortName, recordTypeIcon, toneLabel } from "../model/record";
import { CheckRow, InProgressChip, ringTone, useCompleting } from "./checklist";
import { InboxAdd } from "./InboxAdd";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink } from "./record-link";
const doneText: Record<RecordType, string> = { task: "Tarefa concluída.", problem: "Problema resolvido.", feedback: "Marcado como conversado." };

function dueTone(dueAt: string, today: string): string {
  const day = dueDay(dueAt);
  if (day < today) return "text-danger";
  if (day === today) return "text-accent";
  return "text-muted";
}

function ItemInfo({ item, today, fading }: { item: InboxItem; today: string; fading: boolean }) {
  return (
    <>
      {item.dueAt ? (
        <span className={`inline-flex items-center gap-1 tabular-nums ${dueTone(item.dueAt, today)}`}>
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {dueLabel(item.dueAt, today)}
        </span>
      ) : null}
      {item.tone ? <span>{toneLabel(item.tone)}</span> : null}
      {item.where ? <span>{item.where}</span> : null}
      {item.status === "in_progress" && !fading ? <InProgressChip /> : null}
    </>
  );
}

function TypeTag({ type }: { type: RecordType }) {
  return (
    <span className="inline-flex items-center gap-1">
      {recordShortName(type)}
      <Icon name={recordTypeIcon[type]} className="h-3.5 w-3.5" />
    </span>
  );
}

/** Entrada: registrar rápido (tarefa, problema ou feedback) e ver o que entrou por aqui e ainda está aberto. */
export function InboxPage() {
  const tasks = useTaskBoard();
  const problems = useProblemBoard();
  const feedbacks = useFeedbackBoard();
  const change = useBoardChange();
  const toast = useToast();
  const linkOf = useRecordLink();
  const { fading, complete } = useCompleting();

  const failed = tasks.error ?? problems.error ?? feedbacks.error;
  if (failed) return <Notice>{errorMessage(failed)}</Notice>;
  if (!tasks.data || !problems.data || !feedbacks.data) return <p className="text-sm text-muted">Carregando a Entrada…</p>;
  const today = tasks.data.today;
  const items = inboxItems(tasks.data, problems.data, feedbacks.data);

  function finish(item: InboxItem) {
    complete(item.id, (done) =>
      change.mutate(
        { id: item.id, change: { status: "done" } },
        {
          onSuccess: () => toast({ text: doneText[item.type], action: { label: "Desfazer", run: () => change.mutate({ id: item.id, change: { status: item.status } }) } }),
          onError: (error) => toast({ text: errorMessage(error) }),
          onSettled: done,
        },
      ),
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Entrada" />
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item.id} className={`border-b border-line ${fading.has(item.id) ? "opacity-0 transition-opacity delay-200 duration-200" : ""}`}>
              <CheckRow
                checked={fading.has(item.id)}
                ring={item.priority === "high" ? ringTone.high : item.priority === "medium" ? ringTone.medium : ringTone.plain}
                label={`${item.type === "feedback" ? "Marcar como conversado" : "Concluir"}: ${item.body}`}
                onToggle={() => finish(item)}
                link={linkOf({ id: item.id, origin: "inbox" })}
                title={item.body}
                info={<ItemInfo item={item} today={today} fading={fading.has(item.id)} />}
                tag={<TypeTag type={item.type} />}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-b border-line pb-4 text-sm text-muted">Tudo em dia. O que você registrar aqui fica nesta lista até ser concluído.</p>
      )}
      <div className="mt-4">
        <InboxAdd today={today} />
      </div>
      <RecordModalHost />
    </div>
  );
}
