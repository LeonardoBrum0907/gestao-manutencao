import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RP_SOURCE_LABELS, RP_SOURCES, type RpListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { Icon } from "../../../design/ui/icons";
import { useFactories, useLines, useMembers } from "../../cadastro/data/cadastro";
import { flattenRp, useRpPages } from "../data/rp";
import { rpStatusOptions } from "../model/rp";
import { moreFiltersLabel } from "../../../design/more-filters";
import { RP_COLUMNS, rpStacked, type RpTableRow } from "./rp-table";

// Nome da linha cadastrada (ou a linha do texto) e a TAG, sem repetir o mesmo nome duas vezes.
function place(rp: RpListItemDto, lineNames: Map<string, string>): string[] {
  const first = (rp.lineId && lineNames.get(rp.lineId)) || rp.line;
  const parts = [first, rp.tag].filter((part): part is string => Boolean(part));
  const seen = new Set<string>();
  return parts.filter((part) => {
    const key = part.replace(/\s+/g, "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function technicianNames(rp: RpListItemDto, memberNames: Map<string, string>): string {
  return [...rp.memberIds.map((id) => memberNames.get(id)), rp.unmatchedTechnicians].filter(Boolean).join(", ");
}

// Ordenar só reordena o que já veio; por isso a contagem diz "carregados" enquanto houver mais.
function LoadMore({ loading, onLoad }: { loading: boolean; onLoad: () => void }) {
  return (
    <div className="flex justify-center border-t border-t-line px-4 py-3">
      <Button tone="ghost" onClick={onLoad} disabled={loading}>
        {loading ? "Carregando…" : "Carregar mais"}
      </Button>
    </div>
  );
}

const FILTERS = ["q", "status", "source", "factoryId", "lineId", "memberId", "line", "tag", "repeated", "from", "to"] as const;

export function RpListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const list = useRpPages(params);
  const lines = useLines();
  const members = useMembers();
  const factories = useFactories();
  const items = flattenRp(list.data?.pages);
  const lineNames = new Map(lines.data?.map((line) => [line.id, line.name]));
  const memberNames = new Map(members.data?.map((member) => [member.id, member.name]));
  const filtered = FILTERS.some((key) => params.get(key));
  const hiddenInUse = FILTERS.filter((key) => key !== "q" && params.get(key)).length;
  const [moreOpen, setMoreOpen] = useState(false);
  const rows: RpTableRow[] = items.map((rp) => ({ rp, place: place(rp, lineNames), technicians: technicianNames(rp, memberNames) }));

  function setFilter(key: (typeof FILTERS)[number], value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div>
      <PageTitle
        eyebrow="Turno"
        title="RPs"
        text="Relatórios Padrão de Manutenção. Cole o texto do WhatsApp para registrar, ou abra uma ficha para consultar e ajustar."
        action={
          <Link
            to="/rp/novo"
            className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
          >
            <Icon name="plus" />
            Colar RP
          </Link>
        }
      />
      <Card className="mb-4">
        {/* No celular os 10 filtros empilhados empurravam a lista para baixo da primeira tela: fechado, ali só o
            primeiro campo (Buscar) fica à vista; os outros aparecem em "Mais filtros". */}
        <div id="rp-filtros" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${moreOpen ? "" : "max-sm:[&>label:nth-of-type(n+2)]:hidden"}`}>
          <Field label="Buscar">
            <TextInput
              type="search"
              value={params.get("q") ?? ""}
              placeholder="Problema, descrição ou causa raiz"
              onChange={(event) => setFilter("q", event.target.value)}
            />
          </Field>
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="rp-filtros"
            onClick={() => setMoreOpen((open) => !open)}
            className="order-last justify-self-start text-sm font-semibold text-accent hover:underline sm:hidden"
          >
            {moreOpen ? "Menos filtros" : moreFiltersLabel(hiddenInUse)}
          </button>
          <Field label="Status">
            <SelectInput value={params.get("status") ?? ""} onChange={(event) => setFilter("status", event.target.value)}>
              <option value="">Todos</option>
              {rpStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Origem">
            <SelectInput value={params.get("source") ?? ""} onChange={(event) => setFilter("source", event.target.value)}>
              <option value="">Todas</option>
              {RP_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {RP_SOURCE_LABELS[source]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Técnico">
            <SelectInput value={params.get("memberId") ?? ""} onChange={(event) => setFilter("memberId", event.target.value)}>
              <option value="">Todos</option>
              {members.data?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Linha">
            <SelectInput value={params.get("lineId") ?? ""} onChange={(event) => setFilter("lineId", event.target.value)}>
              <option value="">Todas</option>
              {lines.data?.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Fábrica">
            <SelectInput value={params.get("factoryId") ?? ""} onChange={(event) => setFilter("factoryId", event.target.value)}>
              <option value="">Todas</option>
              {factories.data?.map((factory) => (
                <option key={factory.id} value={factory.id}>
                  {factory.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Linha do texto">
            <TextInput value={params.get("line") ?? ""} onChange={(event) => setFilter("line", event.target.value)} />
          </Field>
          <Field label="TAG">
            <TextInput value={params.get("tag") ?? ""} onChange={(event) => setFilter("tag", event.target.value)} />
          </Field>
          <Field label="Falha repetida">
            <SelectInput value={params.get("repeated") ?? ""} onChange={(event) => setFilter("repeated", event.target.value)}>
              <option value="">Todas</option>
              <option value="true">Só repetidas</option>
              <option value="false">Só as que não se repetiram</option>
            </SelectInput>
          </Field>
          <Field label="De">
            <TextInput type="date" value={params.get("from") ?? ""} onChange={(event) => setFilter("from", event.target.value)} />
          </Field>
          <Field label="Até">
            <TextInput type="date" value={params.get("to") ?? ""} onChange={(event) => setFilter("to", event.target.value)} />
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
      {list.isPending ? <p className="text-sm text-muted">Carregando RPs…</p> : null}
      {list.isSuccess && items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">{filtered ? "Nenhum RP com esses filtros." : "Nenhum RP ainda. Use Colar RP para registrar o primeiro."}</p>
        </Card>
      ) : null}
      {items.length ? (
        <DataTable
          label="RPs"
          rows={rows}
          rowKey={(row) => row.rp.id}
          columns={RP_COLUMNS}
          stacked={rpStacked}
          // A API já manda do mais recente para o mais antigo; a seta só mostra essa ordem.
          defaultSort={{ key: "date", direction: "desc" }}
          countLabel={(count) => `${count} ${count === 1 ? "RP" : "RPs"}${list.hasNextPage ? " carregados" : ""}`}
          onOpen={(row) => navigate(`/rp/${row.rp.id}`)}
          footer={list.hasNextPage ? <LoadMore loading={list.isFetchingNextPage} onLoad={() => void list.fetchNextPage()} /> : null}
        />
      ) : null}
    </div>
  );
}

