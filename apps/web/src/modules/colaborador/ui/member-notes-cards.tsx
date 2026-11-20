import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { FeedbackTone, MemberDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { flattenPages } from "../../registro/data/records";
import { formatWhen, fromLocalInput, nowLocalInput, toneChipClass, toneLabel, toneOptions } from "../../registro/model/record";
import { RecordModalHost } from "../../registro/ui/RecordModal";
import { useRecordLink } from "../../registro/ui/record-link";
import { useGiveMemberFeedback, useMemberRecordList, useMemberRecordSummary } from "../data/member-records";

// Cartões Feedbacks e Observações da aba Comportamento (troca de nomes pedida pelo Léo em 2026-11-20):
// Feedback é a conversa completa que o gestor grava aqui e fica só na ficha; Observação é o que foi lançado
// em Registros com a pessoa como alvo e aparece aqui como histórico.

function NewFeedback({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const give = useGiveMemberFeedback(memberId);
  const [tone, setTone] = useState<FeedbackTone>("positive");
  const [when, setWhen] = useState(nowLocalInput());
  const [body, setBody] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    give.mutate({ body, occurredAt: fromLocalInput(when), tone }, { onSuccess: onDone });
  }

  return (
    <form className="flex flex-col gap-3 border-t border-t-line px-4 py-4" noValidate onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tom">
          <SelectInput value={tone} onChange={(event) => setTone(event.target.value as FeedbackTone)}>
            {toneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Quando">
          <TextInput type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
        </Field>
      </div>
      <Field label="Feedback">
        <TextArea value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      {give.isError ? <Notice>{errorMessage(give.error)}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={give.isPending}>
          Gravar feedback
        </Button>
        <Button tone="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

type NotesProps = {
  title: string;
  count: number | undefined;
  query: ReturnType<typeof useMemberRecordList>;
  empty: string;
  action?: ReactNode;
  form?: ReactNode;
};

// Moldura comum dos dois cartões: título com a contagem, lista com tom, data e "Abrir", e "Carregar mais".
function NotesCard({ title, count, query, empty, action, form }: NotesProps) {
  const items = flattenPages(query.data?.pages);
  const linkOf = useRecordLink();
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-app">
          {title} <span className="font-normal text-muted">({count ?? items.length})</span>
        </h2>
        {action}
      </div>
      {form}
      {query.isError ? <Notice>{errorMessage(query.error)}</Notice> : null}
      {query.isSuccess && items.length === 0 && !form ? <p className="border-t border-t-line px-4 py-3 text-sm text-muted">{empty}</p> : null}
      <ul>
        {items.map((record) => (
          <li key={record.id} data-record-id={record.id} className="border-t border-t-line px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className={toneChipClass(record.tone)}>{record.tone ? toneLabel(record.tone) : "Sem tom"}</span>
              <span>{formatWhen(record.occurredAt)}</span>
              <Link to={linkOf(record).to} state={linkOf(record).state} className="ml-auto font-medium text-accent hover:underline">
                Abrir
              </Link>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-app">{record.body}</p>
          </li>
        ))}
      </ul>
      {query.hasNextPage ? (
        <div className="flex justify-center border-t border-t-line px-4 py-3">
          <Button tone="ghost" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
            {query.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Cartão Feedbacks: o feedback completo que o gestor grava na ficha. Não aparece em Registros.
 * @example <MemberFeedbackCard member={member} />
 */
export function MemberFeedbackCard({ member }: { member: MemberDto }) {
  const query = useMemberRecordList(member.id, "feedback");
  const summary = useMemberRecordSummary(member.id);
  const [adding, setAdding] = useState(false);
  const action = adding ? null : (
    <Button tone="ghost" className="px-3 py-1.5" onClick={() => setAdding(true)}>
      + Feedback
    </Button>
  );
  return (
    <>
      <NotesCard
        title="Feedbacks"
        count={summary.data?.feedbacks}
        query={query}
        empty={`Nenhum feedback ainda. Os feedbacks gravados aqui ficam só na ficha de ${member.name}.`}
        action={action}
        form={adding ? <NewFeedback memberId={member.id} onDone={() => setAdding(false)} /> : null}
      />
      {/* O "Abrir" dos dois cartões abre o registro neste modal, sem sair da ficha. */}
      <RecordModalHost />
    </>
  );
}

/**
 * Cartão Observações: histórico das observações lançadas em Registros com a pessoa como alvo.
 * @example <MemberObservationCard member={member} />
 */
export function MemberObservationCard({ member }: { member: MemberDto }) {
  const query = useMemberRecordList(member.id, "observation");
  const summary = useMemberRecordSummary(member.id);
  return (
    <NotesCard
      title="Observações"
      count={summary.data?.observations}
      query={query}
      empty={`Nenhuma observação ainda. As observações lançadas em Registros com ${member.name} como alvo aparecem aqui.`}
    />
  );
}
