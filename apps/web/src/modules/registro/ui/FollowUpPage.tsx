import { useNavigate, useSearchParams } from "react-router-dom";
import type { DueWindow, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, PageTitle, SelectInput } from "../../../design/ui/controls";
import { useFollowUp } from "../data/records";
import {
  dueChoices,
  followUpFromSearch,
  followUpSearch,
  formatDueDay,
  prazoApplies,
  type FollowUpQuery,
} from "../model/follow-up";
import { recordShortName, statusLabel, statusOptions, typeChoices } from "../model/record";

export function FollowUpPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter = followUpFromSearch(params);
  const list = useFollowUp(filter);
  const dueEnabled = prazoApplies(filter.type);

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

  const empty = list.data?.length === 0;
  const filtered = Boolean(filter.type || filter.status || filter.due);

  return (
    <div>
      <PageTitle
        eyebrow="Caderno"
        title="Acompanhamento"
        text="Organize no computador por tipo, status e prazo. Abra a ficha pela linha."
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
                    className={`rounded-control border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${
                      pressed ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-app"
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
        <Card>{filtered ? "Nenhum registro com esses filtros." : "Nenhum registro ainda. Comece pela captura."}</Card>
      ) : null}
      {list.data && list.data.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-card shadow-card">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-chip text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Registro</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((record) => (
                <tr
                  key={record.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Abrir ficha: ${record.body}`}
                  onClick={() => navigate(`/registros/${record.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/registros/${record.id}`);
                    }
                  }}
                  className="cursor-pointer border-t border-line hover:bg-accent-soft"
                >
                  <td className="px-4 py-3 font-medium">{recordShortName(record.type)}</td>
                  <td className="px-4 py-3">{record.body}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-control bg-chip px-2 py-1 text-xs font-medium text-app">
                      {statusLabel(record.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {record.type === "task" && record.dueAt ? formatDueDay(record.dueAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
