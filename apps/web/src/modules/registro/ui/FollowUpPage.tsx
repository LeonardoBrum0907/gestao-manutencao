import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { DueWindow, RecordListItemDto, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { RowMenu, type RowMenuItem } from "../../../design/ui/row-menu";
import { flattenPages, useFollowUp, usePrefetchRecord } from "../data/records";
import {
  dueChoices,
  followUpFromSearch,
  followUpSearch,
  prazoApplies,
  type FollowUpQuery,
} from "../model/follow-up";
import { originLabel, recordShortName, statusChipClass, statusLabel, statusOptions, typeChoices } from "../model/record";
import { RecordRemoveDialog } from "./RecordRemoveDialog";
import { DueMark, PriorityMark } from "./RecordMarks";

export function FollowUpPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = followUpFromSearch(params);
  const list = useFollowUp(filter);
  const records = flattenPages(list.data?.pages);
  const prefetch = usePrefetchRecord();
  const dueEnabled = prazoApplies(filter.type);
  const [removing, setRemoving] = useState<RecordListItemDto | null>(null);

  function menu(record: RecordListItemDto): RowMenuItem[] {
    return [
      { label: "Abrir ficha", onSelect: () => navigate(`/registros/${record.id}`) },
      { label: "Excluir…", danger: true, onSelect: () => setRemoving(record) },
    ];
  }

  function apply(next: FollowUpQuery) {
    setParams(followUpSearch(next), { replace: true });
  }

  function onType(value: string) {
    const type = value ? (value as RecordType) : null;
    apply({
      ...filter,
      type,
      due: prazoApplies(type) ? filter.due : null,
    });
  }

  function onDue(due: DueWindow) {
    apply({ ...filter, due: filter.due === due ? null : due });
  }

  const empty = list.isSuccess && records.length === 0;
  const filtered = Boolean(filter.type || filter.status || filter.due);

  return (
    <div>
      <PageTitle
        title="Pendências"
        text="Tudo o que foi registrado, para organizar por tipo, status e prazo. Abra a ficha pela linha."
      />
      <Card className="mb-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <Field label="Tipo">
            <SelectInput value={filter.type ?? ""} onChange={(event) => onType(event.target.value)}>
              <option value="">Todos</option>
              {typeChoices.map((choice) => (
                <option key={choice.type} value={choice.type}>
                  {choice.short}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput
              value={filter.status ?? ""}
              onChange={(event) => apply({ ...filter, status: event.target.value ? (event.target.value as FollowUpQuery["status"]) : null })}
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div>
            <p className="text-sm font-medium text-app">Prazo</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {dueChoices.map((choice) => {
                const pressed = filter.due === choice.due;
                return (
                  <button
                    key={choice.due}
                    type="button"
                    aria-pressed={pressed}
                    disabled={!dueEnabled}
                    onClick={() => onDue(choice.due)}
                    className={`rounded-control border px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      pressed ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-app hover:bg-chip"
                    }`}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Prazo só existe na Tarefa.</p>
          </div>
        </div>
      </Card>
      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando lista…</p> : null}
      {empty ? (
        <Card>{filtered ? "Nenhum registro com esses filtros." : "Nenhum registro ainda. Comece por Registrar."}</Card>
      ) : null}
      {records.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {records.map((record) => (
              <div
                key={record.id}
                role="link"
                tabIndex={0}
                aria-label={`Abrir ficha: ${record.body}`}
                onClick={() => navigate(`/registros/${record.id}`)}
                onFocus={() => prefetch.start(record.id)}
                onBlur={prefetch.cancel}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/registros/${record.id}`);
                  }
                }}
                className="cursor-pointer rounded-card border border-line bg-card px-4 py-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{recordShortName(record.type)}</p>
                    {record.origin !== "inbox" ? (
                      <p className="text-xs text-muted">{originLabel(record.origin)}</p>
                    ) : null}
                  </div>
                  <div className="-mr-2 -mt-1 flex items-center gap-1">
                    <span className={statusChipClass(record.status)}>{statusLabel(record.status)}</span>
                    <RowMenu label="Mais ações do registro" items={menu(record)} />
                  </div>
                </div>
                <div className="mt-2">
                  <DueMark record={record} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-app" title={record.body}>
                  {record.body}
                </p>
                <PriorityMark record={record} />
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-card border border-line bg-card shadow-card sm:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-chip text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Registro</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Prazo</th>
                  <th className="w-14 px-2 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Abrir ficha: ${record.body}`}
                    onClick={() => navigate(`/registros/${record.id}`)}
                    onMouseEnter={() => prefetch.start(record.id)}
                    onMouseLeave={prefetch.cancel}
                    onFocus={() => prefetch.start(record.id)}
                    onBlur={prefetch.cancel}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/registros/${record.id}`);
                      }
                    }}
                    className="cursor-pointer border-t border-line hover:bg-accent-soft"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{recordShortName(record.type)}</p>
                      {record.origin !== "inbox" ? (
                        <p className="text-xs text-muted">{originLabel(record.origin)}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="line-clamp-2" title={record.body}>
                        {record.body}
                      </p>
                      <PriorityMark record={record} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusChipClass(record.status)}>{statusLabel(record.status)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <DueMark record={record} />
                    </td>
                    <td className="px-2 py-1.5">
                      <RowMenu label="Mais ações do registro" items={menu(record)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.hasNextPage ? (
            <div className="mt-4 flex justify-center">
              <Button tone="ghost" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                {list.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      {removing ? <RecordRemoveDialog record={removing} onCancel={() => setRemoving(null)} onDeleted={() => setRemoving(null)} /> : null}
    </div>
  );
}
