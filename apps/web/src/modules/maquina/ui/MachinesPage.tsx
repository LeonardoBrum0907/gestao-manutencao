import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { useFactories, useLines, useMachines } from "../../cadastro/data/cadastro";
import { machineStatusOptions } from "../../cadastro/model/labels";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { usePostPreventives } from "../../pos-preventiva/data/post-preventives";
import { machineStatusFilter } from "../model/machine-status-filter";
import { MACHINE_COLUMNS, machineStacked, type MachineTableRow } from "./machine-table";

const FILTERS = ["q", "factoryId", "lineId", "situacao", "points"] as const;

// Busca sem diferenciar maiúscula nem acento.
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// Todas as máquinas, para chegar à tela de cada uma sem passar por Configurações.
export function MachinesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const machines = useMachines();
  const lines = useLines();
  const factories = useFactories();
  const catalog = useMatrixCatalog();
  const points = usePostPreventives({ active: "true" });
  const lineById = new Map(lines.data?.map((line) => [line.id, line]));
  const factoryNames = new Map(factories.data?.map((factory) => [factory.id, factory.name]));
  const modelNames = new Map(catalog.data?.equipments.map((equipment) => [equipment.id, equipment.name]));
  const pointCount = new Map<string, number>();
  for (const item of points.data ?? []) pointCount.set(item.machineId, (pointCount.get(item.machineId) ?? 0) + 1);

  const query = fold(params.get("q") ?? "").trim();
  const factoryId = params.get("factoryId") ?? "";
  const lineId = params.get("lineId") ?? "";
  const status = machineStatusFilter(params.get("situacao"));
  const onlyPoints = params.get("points") === "true";
  const filtered = FILTERS.some((key) => params.get(key));
  const factoryLines = (lines.data ?? []).filter((line) => !factoryId || line.factoryId === factoryId);

  const rows = (machines.data ?? [])
    .map((machine): MachineTableRow => {
      const line = lineById.get(machine.lineId);
      const place = [line ? factoryNames.get(line.factoryId) : null, line?.name].filter(Boolean).join(" · ") || "Sem linha";
      return { machine, line, place, model: modelNames.get(machine.equipmentId ?? "") ?? null, points: pointCount.get(machine.id) ?? 0 };
    })
    .filter(({ machine, line }) => {
      if (lineId && machine.lineId !== lineId) return false;
      if (factoryId && line?.factoryId !== factoryId) return false;
      if (status && machine.status !== status) return false;
      if (onlyPoints && !pointCount.get(machine.id)) return false;
      if (!query) return true;
      const text = [machine.name, machine.tag, machine.manufacturer, line?.name, line?.internalCode, modelNames.get(machine.equipmentId ?? "")];
      return fold(text.filter(Boolean).join(" ")).includes(query);
    })
    .sort((a, b) => (a.line?.name ?? "").localeCompare(b.line?.name ?? "", "pt-BR") || a.machine.name.localeCompare(b.machine.name, "pt-BR"));

  // Trocar a fábrica limpa a linha, que pode não ser dela.
  function setFilter(key: (typeof FILTERS)[number], value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "factoryId") next.delete("lineId");
    setParams(next, { replace: true });
  }

  return (
    <div>
      <PageTitle
        eyebrow="Turno"
        title="Máquinas"
        text="Abra a máquina para ver os pontos de atenção, o histórico pós-preventiva e os RPs da linha, ou para exportar a folha do técnico."
        action={
          <Link
            to="/configuracoes/fabricas"
            className="inline-flex items-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft"
          >
            Cadastrar máquinas
          </Link>
        }
      />
      <Card className="mb-4">
        {/* Dois filtros por fileira no celular: um por fileira empurrava a lista para baixo da primeira tela. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Field label="Buscar">
              <TextInput
                type="search"
                value={params.get("q") ?? ""}
                placeholder="Máquina, TAG ou linha"
                onChange={(event) => setFilter("q", event.target.value)}
              />
            </Field>
          </div>
          <Field label="Fábrica">
            <SelectInput value={factoryId} onChange={(event) => setFilter("factoryId", event.target.value)}>
              <option value="">Todas</option>
              {factories.data?.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Linha">
            <SelectInput value={lineId} onChange={(event) => setFilter("lineId", event.target.value)}>
              <option value="">Todas</option>
              {factoryLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Situação">
            <SelectInput value={status ?? ""} onChange={(event) => setFilter("situacao", event.target.value)}>
              <option value="">Todas</option>
              {machineStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Pontos de atenção">
            <SelectInput value={onlyPoints ? "true" : ""} onChange={(event) => setFilter("points", event.target.value)}>
              <option value="">Todas</option>
              <option value="true">Com ponto ativo</option>
            </SelectInput>
          </Field>
        </div>
        {filtered ? (
          <div className="mt-4">
            <Button tone="ghost" onClick={() => setParams({}, { replace: true })}>
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </Card>
      {machines.isError ? <Notice>{errorMessage(machines.error)}</Notice> : null}
      {machines.isPending ? <p className="text-sm text-muted">Carregando máquinas…</p> : null}
      {machines.isSuccess && rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            {filtered ? (
              "Nenhuma máquina com esses filtros."
            ) : (
              <>
                Nenhuma máquina cadastrada ainda. Cadastre as máquinas de cada linha em{" "}
                <Link to="/configuracoes/fabricas" className="font-semibold text-accent hover:underline">
                  Configurações
                </Link>
                .
              </>
            )}
          </p>
        </Card>
      ) : null}
      {rows.length ? (
        <DataTable
          label="Máquinas"
          rows={rows}
          rowKey={(row) => row.machine.id}
          columns={MACHINE_COLUMNS}
          stacked={machineStacked}
          groupBy={(row) => ({ key: row.machine.lineId, title: row.place })}
          defaultSort={{ key: "name", direction: "asc" }}
          countLabel={(count) => (count === 1 ? "1 máquina" : `${count} máquinas`)}
          onOpen={(row) => navigate(`/maquinas/${row.machine.id}`)}
        />
      ) : null}
    </div>
  );
}
