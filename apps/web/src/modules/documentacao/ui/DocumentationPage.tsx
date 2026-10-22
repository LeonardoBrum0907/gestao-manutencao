import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { TECH_CARD_TYPES, TECH_CARD_TYPE_LABELS, type TechCardHit } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { Icon } from "../../../design/ui/icons";
import { useLines, useMachines } from "../../cadastro/data/cadastro";
import { formatDay } from "../../colaborador/model/pdi-items";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { usePostPreventives } from "../../pos-preventiva/data/post-preventives";
import { useTechCardSearch, type TechCardFilter } from "../data/tech-docs";
import type { ScopeStart } from "../model/tech-card";
import { TechCardModal } from "./TechCardModal";
import { TECH_CARD_COLUMNS, techCardStacked } from "./tech-card-table";

const FILTERS = ["q", "type", "lineId", "machineId", "equipmentId", "review"] as const;
type FilterKey = (typeof FILTERS)[number];

// A busca espera o usuário parar de digitar antes de ir ao servidor.
const TYPING_PAUSE = 250;

function useTypedQuery(fromUrl: string, onSettle: (value: string) => void) {
  const [typed, setTyped] = useState(fromUrl);
  useEffect(() => setTyped(fromUrl), [fromUrl]);
  useEffect(() => {
    if (typed === fromUrl) return;
    const timer = window.setTimeout(() => onSettle(typed), TYPING_PAUSE);
    return () => window.clearTimeout(timer);
  }, [typed, fromUrl, onSettle]);
  return [typed, setTyped] as const;
}

// Com que alvo uma ficha nova começa: o mesmo do filtro da tela.
function startFrom(filter: TechCardFilter, machineLineId: string): ScopeStart {
  if (filter.machineId) return { scopeKind: "machine", targetId: filter.machineId, lineId: machineLineId };
  if (filter.lineId) return { scopeKind: "line", targetId: filter.lineId };
  if (filter.equipmentId) return { scopeKind: "equipment", targetId: filter.equipmentId };
  return {};
}

function PostPreventiveHits({ ids }: { ids: string[] }) {
  const items = usePostPreventives({}, ids.length > 0);
  const hits = (items.data ?? []).filter((item) => ids.includes(item.id));
  if (!hits.length) return null;
  return (
    <Card className="mt-4">
      <h2 className="text-sm font-semibold text-app">Pós-preventiva com o mesmo assunto</h2>
      <ul className="mt-2 flex flex-col">
        {hits.map((item) => (
          <li key={item.id} className="border-t border-line py-2 first:border-t-0">
            <Link to={`/pos-preventiva/${item.id}`} className="text-sm text-app hover:text-accent">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{formatDay(item.preventiveDate)}</span>
              <span className="block">{item.occurrence}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Tela Documentação: uma busca só sobre as fichas (código, nº de peça, termo, tag), com filtros por tipo, linha, máquina e modelo.
 * Chega da tela da máquina já filtrada (?machineId=).
 */
export function DocumentationPage() {
  const [params, setParams] = useSearchParams();
  const filter: TechCardFilter = Object.fromEntries(FILTERS.map((key) => [key, params.get(key) ?? ""]));
  const lines = useLines();
  const machines = useMachines();
  const catalog = useMatrixCatalog();
  const results = useTechCardSearch(filter);
  const [open, setOpen] = useState<TechCardHit | null>(null);
  const [creating, setCreating] = useState(false);

  function setFilter(key: FilterKey, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "lineId") next.delete("machineId");
    setParams(next, { replace: true });
  }
  const [typed, setTyped] = useTypedQuery(filter.q ?? "", (value) => setFilter("q", value));

  const lineMachines = (machines.data ?? []).filter((machine) => !filter.lineId || machine.lineId === filter.lineId);
  const lineNames = new Map(lines.data?.map((line) => [line.id, line.name]));
  const machineLineId = machines.data?.find((machine) => machine.id === filter.machineId)?.lineId ?? "";
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const filtered = FILTERS.some((key) => params.get(key));
  const hits = results.data?.hits ?? [];

  return (
    <div>
      <PageTitle
        eyebrow="Turno"
        title="Documentação técnica"
        text="Fichas curtas tiradas dos manuais: código de erro, ligação entre máquinas, sinal, peça, parâmetro e procedimento, cada uma com a página de origem. Busque pelo código, nº de peça, palavra ou termo em alemão."
        action={
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Icon name="plus" />
            Nova ficha
          </Button>
        }
      />
      <Card className="mb-4">
        <Field label="Buscar">
          <TextInput
            type="search"
            autoFocus
            value={typed}
            placeholder="Ex.: A-001, correia, sensor"
            className="text-base"
            onChange={(event) => setTyped(event.target.value)}
          />
        </Field>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Tipo">
            <SelectInput value={filter.type} onChange={(event) => setFilter("type", event.target.value)}>
              <option value="">Todos</option>
              {TECH_CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TECH_CARD_TYPE_LABELS[type].many}
                </option>
              ))}
            </SelectInput>
          </Field>
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
          <Field label="Modelo">
            <SelectInput value={filter.equipmentId} onChange={(event) => setFilter("equipmentId", event.target.value)}>
              <option value="">Todos</option>
              {equipments.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        {/* A caixa fica sempre à vista: dentro do "Limpar" ela só aparecia depois de outro filtro, e na tela limpa não
            havia como listar as fichas a revisar. Vem antes do "Limpar" para não pular de lugar quando ele aparece. */}
        <div className="mt-4 flex min-h-10 flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-app">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--accent)]"
              checked={filter.review === "true"}
              onChange={(event) => setFilter("review", event.target.checked ? "true" : "")}
            />
            Só as que precisam de revisão
          </label>
          {filtered ? (
            <Button tone="ghost" onClick={() => setParams({}, { replace: true })}>
              Limpar
            </Button>
          ) : null}
        </div>
      </Card>
      {results.isError ? <Notice>{errorMessage(results.error)}</Notice> : null}
      {results.isPending ? <p className="text-sm text-muted">Buscando…</p> : null}
      {results.isSuccess && hits.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">
            {filtered ? "Nenhuma ficha com essa busca." : "Nenhuma ficha ainda. Crie a primeira em “Nova ficha” ou peça à IA, pelo conector, que leia um PDF."}
          </p>
        </Card>
      ) : null}
      {hits.length ? (
        <DataTable
          label="Fichas"
          rows={hits}
          rowKey={(row) => row.id}
          columns={TECH_CARD_COLUMNS}
          stacked={techCardStacked}
          countLabel={(count) => `${count} de ${results.data?.total ?? count} ${count === 1 ? "ficha" : "fichas"}`}
          onOpen={setOpen}
        />
      ) : null}
      {results.data ? <PostPreventiveHits ids={results.data.postPreventiveIds} /> : null}
      {open ? <TechCardModal key={open.id} card={open} onClose={() => setOpen(null)} /> : null}
      {creating ? <TechCardModal card={null} start={startFrom(filter, machineLineId)} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}
