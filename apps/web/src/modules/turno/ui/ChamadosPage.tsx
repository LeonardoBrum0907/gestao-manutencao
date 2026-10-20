import { useSearchParams } from "react-router-dom";
import type { ChamadoDto, ChamadoShift, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { Icon } from "../../../design/ui/icons";
import { useLines, useMachines, useMembers } from "../../cadastro/data/cadastro";
import { useChamadosOfDay } from "../data/shift";
import {
  addDays,
  chamadoStatusChoices,
  dayTitle,
  shiftChoices,
  shiftLabel,
  today,
} from "../model/chamado";
import { chamadosDaySummary } from "../model/chamado-summary";
import { ChamadoPanel } from "./ChamadoPanel";
import { CHAMADO_COLUMNS, chamadoStacked, type ChamadoTableRow } from "./chamado-table";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const NEW = "novo";

type Group = { key: string; title: string; items: ChamadoDto[] };

function groupByShift(items: ChamadoDto[]): Group[] {
  const keys: (ChamadoShift | null)[] = ["first", "second", "third", null];
  return keys.flatMap((shift) => {
    const mine = items.filter((item) => item.shift === shift);
    if (!mine.length) return [];
    const count = `${mine.length} ${mine.length === 1 ? "chamado" : "chamados"}`;
    return [{ key: shift ?? "none", title: `${shift ? shiftLabel(shift) : "Sem turno"} · ${count}`, items: mine }];
  });
}

export function ChamadosPage() {
  const [params, setParams] = useSearchParams();
  const rawDay = params.get("dia") ?? "";
  const day = DAY.test(rawDay) ? rawDay : today();
  const shift = params.get("turno") ?? "";
  const lineFilter = params.get("linha") ?? "";
  const statusFilter = params.get("status") ?? "";
  const openId = params.get("abrir");
  const list = useChamadosOfDay(day);
  const lines = useLines();
  const machines = useMachines();
  const members = useMembers();
  const lineNames = new Map(lines.data?.map((line) => [line.id, line.name]));
  const machineNames = new Map(machines.data?.map((machine) => [machine.id, machine.name]));
  const memberNames = new Map(members.data?.map((member) => [member.id, member.name]));

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }

  const all = list.data ?? [];
  const shown = all.filter(
    (item) =>
      (!shift || item.shift === shift || (shift === "none" && !item.shift)) &&
      (!lineFilter || item.lineId === lineFilter) &&
      (!statusFilter || item.status === statusFilter),
  );
  const groups = groupByShift(shown);
  // As linhas vão na ordem dos grupos (1º, 2º, 3º turno, sem turno), que é a ordem das faixas na tabela.
  const groupOf = new Map(groups.flatMap((group) => group.items.map((item) => [item.id, { key: group.key, title: group.title }] as const)));
  const open = openId && openId !== NEW ? all.find((item) => item.id === openId) ?? null : null;
  const filtered = Boolean(shift || lineFilter || statusFilter);

  function place(item: ChamadoDto): { line: string; machine: string } {
    if (item.lineLabel) return { line: item.lineLabel, machine: "Fora do cadastro" };
    return {
      line: (item.lineId && lineNames.get(item.lineId)) || "Sem linha",
      machine: (item.machineId && machineNames.get(item.machineId)) || "",
    };
  }

  function people(item: ChamadoDto): string {
    return item.memberIds.map((id) => memberNames.get(id)?.split(" ")[0] ?? "").filter(Boolean).join(", ");
  }

  const rows: ChamadoTableRow[] = groups.flatMap((group) => group.items.map((item) => ({ item, ...place(item), people: people(item) })));

  return (
    <div>
      <PageTitle
        eyebrow="Turno"
        title="Chamados"
        text="O que o time atendeu no dia. Só vai para Registros o que precisar de ação depois."
        action={
          <Button onClick={() => update({ abrir: NEW })} className="gap-2">
            <Icon name="plus" />
            Novo chamado
          </Button>
        }
      />
      <Card className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex flex-col gap-1.5 text-sm text-app">
            <span className="font-medium">Dia</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Dia anterior"
                onClick={() => update({ dia: addDays(day, -1), abrir: null })}
                className="grid h-10 w-10 place-items-center rounded-control border border-line bg-surface text-lg text-app transition hover:bg-chip"
              >
                ‹
              </button>
              <label className="relative">
                <span className="sr-only">Escolher o dia</span>
                <TextInput type="date" value={day} onChange={(event) => update({ dia: event.target.value || null, abrir: null })} className="w-44" />
              </label>
              <button
                type="button"
                aria-label="Próximo dia"
                onClick={() => update({ dia: addDays(day, 1), abrir: null })}
                className="grid h-10 w-10 place-items-center rounded-control border border-line bg-surface text-lg text-app transition hover:bg-chip"
              >
                ›
              </button>
              {day !== today() ? (
                <button type="button" onClick={() => update({ dia: null, abrir: null })} className="ml-1 rounded-control px-2 py-2 text-sm font-semibold text-accent hover:underline">
                  Hoje
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-sm text-app">
            <span className="font-medium">Turno</span>
            <div role="group" aria-label="Turno" className="flex gap-2">
              {[{ value: "", short: "Todos" }, ...shiftChoices].map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={shift === choice.value}
                  onClick={() => update({ turno: choice.value || null })}
                  className={`min-h-10 rounded-control border px-3 py-2 text-sm font-semibold transition ${
                    shift === choice.value ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-app hover:bg-chip"
                  }`}
                >
                  {choice.short}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:w-[420px]">
            <Field label="Linha">
              <SelectInput value={lineFilter} searchable onChange={(event) => update({ linha: event.target.value || null })}>
                <option value="">Todas as linhas</option>
                {lines.data?.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Status">
              <SelectInput value={statusFilter} onChange={(event) => update({ status: (event.target.value as RecordStatus) || null })}>
                <option value="">Todos</option>
                {chamadoStatusChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </div>
      </Card>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-app">{dayTitle(day)}</h2>
        <p className="text-sm text-muted">{chamadosDaySummary(shown)}</p>
      </div>

      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando chamados…</p> : null}
      {list.isSuccess && !shown.length ? (
        <Card>{filtered && all.length ? "Nenhum chamado com esses filtros." : "Nenhum chamado neste dia. Abra um em Novo chamado."}</Card>
      ) : null}

      {groups.length ? (
        <DataTable
          label="Chamados"
          rows={rows}
          rowKey={(row) => row.item.id}
          columns={CHAMADO_COLUMNS}
          stacked={chamadoStacked}
          groupBy={(row) => groupOf.get(row.item.id) ?? { key: "none", title: "Sem turno" }}
          countLabel={(count) => `${count} ${count === 1 ? "chamado" : "chamados"}`}
          selectedKey={openId}
          onOpen={(row) => update({ abrir: row.item.id })}
        />
      ) : null}

      {openId === NEW ? (
        <ChamadoPanel
          key={NEW}
          chamado={null}
          day={day}
          onClose={() => update({ abrir: null })}
          onCreated={(saved) => update({ abrir: null, dia: saved.day === today() ? null : saved.day })}
        />
      ) : open ? (
        <ChamadoPanel key={open.id} chamado={open} day={day} onClose={() => update({ abrir: null })} onCreated={() => undefined} />
      ) : null}
    </div>
  );
}
