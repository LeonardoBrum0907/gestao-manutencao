import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { useLines, useMachines, useMembers, useSubassemblies } from "../../cadastro/data/cadastro";
import { formatDay } from "../../colaborador/model/pdi-items";
import { usePostPreventives, type PostPreventiveFilter } from "../data/post-preventives";

const FILTERS = ["lineId", "machineId", "subassemblyId", "memberId", "active", "from", "to"] as const;

export function AttentionChip({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-control bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">Ponto ativo</span>
  ) : (
    <span className="rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted">Ponto desligado</span>
  );
}

export function PostPreventiveListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const filter: PostPreventiveFilter = Object.fromEntries(FILTERS.map((key) => [key, params.get(key) ?? ""]));
  const list = usePostPreventives(filter);
  const lines = useLines();
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const members = useMembers();
  const lineNames = new Map(lines.data?.map((line) => [line.id, line.name]));
  const machineById = new Map(machines.data?.map((machine) => [machine.id, machine]));
  const subassemblyNames = new Map(subassemblies.data?.map((item) => [item.id, item.name]));
  const memberNames = new Map(members.data?.map((member) => [member.id, member.name]));
  const filtered = FILTERS.some((key) => params.get(key));
  const lineMachines = (machines.data ?? []).filter((machine) => !filter.lineId || machine.lineId === filter.lineId);
  const pickedMachine = filter.machineId ? machineById.get(filter.machineId) : undefined;
  const machineSubassemblies = (subassemblies.data ?? []).filter((item) => pickedMachine?.equipmentId && item.equipmentId === pickedMachine.equipmentId);
  const items = list.data ?? [];

  // Trocar a linha ou a máquina limpa o que depende dela.
  function setFilter(key: (typeof FILTERS)[number], value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "lineId") next.delete("machineId");
    if (key === "lineId" || key === "machineId") next.delete("subassemblyId");
    setParams(next, { replace: true });
  }

  return (
    <div>
      <PageTitle
        eyebrow="Turno"
        title="Pós-preventiva"
        text="Ocorrências que apareceram depois de uma preventiva, com a ação preventiva e o ponto de atenção para a próxima. A folha do técnico sai da tela da máquina."
        action={
          <Link
            to="/pos-preventiva/nova"
            className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
          >
            <Icon name="plus" />
            Nova ficha
          </Link>
        }
      />
      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Linha">
            <SelectInput value={filter.lineId} onChange={(event) => setFilter("lineId", event.target.value)}>
              <option value="">Todas</option>
              {lines.data?.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Máquina">
            <SelectInput value={filter.machineId} onChange={(event) => setFilter("machineId", event.target.value)}>
              <option value="">Todas</option>
              {lineMachines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {filter.lineId ? machine.name : `${lineNames.get(machine.lineId) ?? "Linha"} · ${machine.name}`}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Subconjunto">
            <SelectInput value={filter.subassemblyId} disabled={!pickedMachine} onChange={(event) => setFilter("subassemblyId", event.target.value)}>
              <option value="">{pickedMachine ? "Todos" : "Escolha a máquina antes"}</option>
              {machineSubassemblies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Técnico">
            <SelectInput value={filter.memberId} onChange={(event) => setFilter("memberId", event.target.value)}>
              <option value="">Todos</option>
              {members.data?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Ponto de atenção">
            <SelectInput value={filter.active} onChange={(event) => setFilter("active", event.target.value)}>
              <option value="">Todos</option>
              <option value="true">Só os ativos</option>
            </SelectInput>
          </Field>
          <Field label="Preventiva de">
            <TextInput type="date" value={filter.from} onChange={(event) => setFilter("from", event.target.value)} />
          </Field>
          <Field label="Até">
            <TextInput type="date" value={filter.to} onChange={(event) => setFilter("to", event.target.value)} />
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
      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando fichas…</p> : null}
      {list.isSuccess && items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">{filtered ? "Nenhuma ficha com esses filtros." : "Nenhuma ficha ainda. Use Nova ficha para registrar a primeira."}</p>
        </Card>
      ) : null}
      {items.length ? (
        <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <ul>
            {items.map((item) => {
              const machine = machineById.get(item.machineId);
              return (
                <li key={item.id} className="border-t border-t-line first:border-t-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/pos-preventiva/${item.id}`)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent-soft"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        {formatDay(item.preventiveDate)} · {lineNames.get(item.lineId) ?? "Linha"} · {machine?.name ?? "Máquina"} ·{" "}
                        {subassemblyNames.get(item.subassemblyId) ?? "Subconjunto"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-app" title={item.occurrence}>
                        {item.occurrence}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted" title={item.attentionPoint}>
                        Atenção: {item.attentionPoint}
                      </p>
                      <p className="mt-1 text-xs text-muted">{item.memberIds.map((id) => memberNames.get(id)).filter(Boolean).join(", ")}</p>
                    </div>
                    <div className="shrink-0">
                      <AttentionChip active={item.attentionActive} />
                    </div>
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
