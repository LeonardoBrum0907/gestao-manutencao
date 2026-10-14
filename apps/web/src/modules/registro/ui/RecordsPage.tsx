import { useNavigate, useSearchParams } from "react-router-dom";
import type { RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { useLines, useMachines, useMembers, useSubassemblies } from "../../cadastro/data/cadastro";
import { useAllRecords } from "../data/all-records";
import {
  GROUP_MODES,
  STATUS_SCOPES,
  defaultRecordOrder,
  filterRecords,
  recordGroup,
  sortByGroup,
  withNames,
  type GroupMode,
  type RecordFilter,
  type RecordRow,
  type StatusScope,
} from "../model/records-table";
import { RecordModalHost } from "./RecordModal";
import { useRecordLink, useRecordModal } from "./record-link";
import { RECORD_COLUMNS, recordStacked } from "./records-table-columns";

// Os filtros ficam no endereço (?q=…&tipo=…): voltar da ficha ou mandar o link mantém a mesma busca.
const TYPE_PARAM: Record<string, RecordType> = { tarefas: "task", problemas: "problem", feedbacks: "feedback" };
const tabs: { param: string; label: string; type: RecordType | null }[] = [
  { param: "", label: "Todos", type: null },
  { param: "tarefas", label: "Tarefas", type: "task" },
  { param: "problemas", label: "Problemas", type: "problem" },
  { param: "feedbacks", label: "Feedbacks", type: "feedback" },
];
const scopeLabel: Record<StatusScope, string> = { abertos: "Abertos", concluidos: "Concluídos", todos: "Todas as situações" };
const groupLabel: Record<GroupMode, string> = { nenhum: "Sem agrupar", tipo: "Agrupar por tipo", linha: "Agrupar por linha", maquina: "Agrupar por máquina", situacao: "Agrupar por situação", pessoa: "Agrupar por pessoa" };

function pick<T extends string>(value: string | null, options: readonly T[], fallback: T): T {
  return value && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function useRecordFilter() {
  const [params, setParams] = useSearchParams();
  const filter: RecordFilter = {
    q: params.get("q") ?? "",
    type: TYPE_PARAM[params.get("tipo") ?? ""] ?? null,
    scope: pick(params.get("situacao"), STATUS_SCOPES, "abertos"),
    lineId: params.get("linha"),
    memberId: params.get("pessoa"),
  };
  const group = pick(params.get("agrupar"), GROUP_MODES, "nenhum");
  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }
  return { filter, group, tipo: params.get("tipo") ?? "", update };
}

function useRecordRows(): { rows: RecordRow[] | null; error: unknown } {
  const records = useAllRecords();
  const lines = useLines();
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const members = useMembers();
  if (records.error) return { rows: null, error: records.error };
  if (!records.data) return { rows: null, error: null };
  const names = {
    lines: new Map(lines.data?.map((line) => [line.id, line.name])),
    machines: new Map(machines.data?.map((machine) => [machine.id, machine.name])),
    subassemblies: new Map(subassemblies.data?.map((item) => [item.id, item.name])),
    members: new Map(members.data?.map((member) => [member.id, member.name])),
  };
  return { rows: records.data.map((item) => withNames(item, names)), error: null };
}

function countLine(count: number): string {
  return count === 1 ? "1 registro" : `${count} registros`;
}

/** Registros: todos os registros numa tabela, com busca, filtros, ordenar pelo cabeçalho e agrupar. */
export function RecordsPage() {
  const { filter, group, tipo, update } = useRecordFilter();
  const { rows, error } = useRecordRows();
  const lines = useLines();
  const members = useMembers();
  const linkOf = useRecordLink();
  const modal = useRecordModal();
  const navigate = useNavigate();

  const withoutType = rows ? filterRecords(rows, filter, true) : [];
  const shown = withoutType.filter((row) => !filter.type || row.type === filter.type).sort(defaultRecordOrder);
  const ordered = group === "nenhum" ? shown : sortByGroup(shown, group);
  const filtered = Boolean(filter.q || filter.lineId || filter.memberId || filter.scope !== "abertos");

  function open(row: RecordRow) {
    const link = linkOf(row);
    navigate(link.to, { state: link.state });
  }

  return (
    <div>
      <PageTitle title="Registros" text="Todas as tarefas, problemas e feedbacks, inclusive os concluídos. Procure, filtre e agrupe." />
      <div role="tablist" aria-label="Tipo de registro" className="-mt-2 mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          const count = withoutType.filter((row) => !tab.type || row.type === tab.type).length;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={tipo === tab.param}
              onClick={() => update({ tipo: tab.param || null })}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] transition ${tipo === tab.param ? "border-accent font-semibold text-app" : "border-transparent text-muted hover:text-app"}`}
            >
              {tab.label} {rows ? <span className="text-[13px] tabular-nums text-muted">{count}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,11rem))]">
        <label className="col-span-2 lg:col-span-1">
          <span className="sr-only">Procurar</span>
          <TextInput type="search" value={filter.q} placeholder="Procurar no texto, linha, máquina ou pessoa" onChange={(event) => update({ q: event.target.value || null })} />
        </label>
        <SelectInput aria-label="Situação" value={filter.scope} onChange={(event) => update({ situacao: event.target.value === "abertos" ? null : event.target.value })}>
          {STATUS_SCOPES.map((scope) => (
            <option key={scope} value={scope}>
              {scopeLabel[scope]}
            </option>
          ))}
        </SelectInput>
        <SelectInput aria-label="Linha" value={filter.lineId ?? ""} searchable onChange={(event) => update({ linha: event.target.value || null })}>
          <option value="">Todas as linhas</option>
          {lines.data?.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput aria-label="Pessoa" value={filter.memberId ?? ""} searchable onChange={(event) => update({ pessoa: event.target.value || null })}>
          <option value="">Todas as pessoas</option>
          {members.data?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </SelectInput>
        <SelectInput aria-label="Agrupar" value={group} onChange={(event) => update({ agrupar: event.target.value === "nenhum" ? null : event.target.value })}>
          {GROUP_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {groupLabel[mode]}
            </option>
          ))}
        </SelectInput>
      </div>
      {error ? <Notice>{errorMessage(error)}</Notice> : null}
      {!rows && !error ? <p className="text-sm text-muted">Carregando registros…</p> : null}
      {rows && !ordered.length ? <Card>{filtered ? "Nada com essa busca e esses filtros." : "Nenhum registro aberto."}</Card> : null}
      {ordered.length ? (
        <>
          <p className="mb-2 hidden justify-end text-sm text-muted md:flex">{countLine(ordered.length)}</p>
          <DataTable
            key={group}
            label="Registros"
            rows={ordered}
            rowKey={(row) => row.id}
            columns={RECORD_COLUMNS}
            stacked={recordStacked}
            groupBy={group === "nenhum" ? undefined : (row) => recordGroup(row, group)}
            onOpen={open}
            selectedKey={modal.id}
            countLabel={countLine}
          />
        </>
      ) : null}
      <RecordModalHost />
    </div>
  );
}
