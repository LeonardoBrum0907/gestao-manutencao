import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { useFactories, useLines, useMachines } from "../../cadastro/data/cadastro";
import { machineStatusClass, machineStatusLabel } from "../../cadastro/model/labels";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { usePostPreventives } from "../../pos-preventiva/data/post-preventives";

const FILTERS = ["q", "factoryId", "lineId", "points"] as const;

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
  const onlyPoints = params.get("points") === "true";
  const filtered = FILTERS.some((key) => params.get(key));
  const factoryLines = (lines.data ?? []).filter((line) => !factoryId || line.factoryId === factoryId);

  const rows = (machines.data ?? [])
    .map((machine) => ({ machine, line: lineById.get(machine.lineId) }))
    .filter(({ machine, line }) => {
      if (lineId && machine.lineId !== lineId) return false;
      if (factoryId && line?.factoryId !== factoryId) return false;
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar">
            <TextInput
              type="search"
              value={params.get("q") ?? ""}
              placeholder="Máquina, TAG ou linha"
              onChange={(event) => setFilter("q", event.target.value)}
            />
          </Field>
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
          <Field label="Pontos de atenção">
            <SelectInput value={onlyPoints ? "true" : ""} onChange={(event) => setFilter("points", event.target.value)}>
              <option value="">Todas as máquinas</option>
              <option value="true">Só com ponto ativo</option>
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
        <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <ul>
            {rows.map(({ machine, line }) => {
              const count = pointCount.get(machine.id) ?? 0;
              const model = machine.equipmentId ? modelNames.get(machine.equipmentId) : null;
              return (
                <li key={machine.id} className="border-t border-t-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/maquinas/${machine.id}`)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent-soft"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        {[line ? factoryNames.get(line.factoryId) : null, line?.name].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-app">{machine.name}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[model ?? "Sem modelo", machine.tag ? `TAG ${machine.tag}` : null].filter(Boolean).join(" · ")}
                        {machine.status === "stopped" ? (
                          <span className={machineStatusClass(machine.status)}> · {machineStatusLabel(machine.status)}</span>
                        ) : null}
                      </p>
                    </div>
                    {count ? (
                      <span className="shrink-0 rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                        {count} {count === 1 ? "ponto ativo" : "pontos ativos"}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
