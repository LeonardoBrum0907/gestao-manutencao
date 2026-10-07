import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { RpListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { useFactories, useLines, useMembers } from "../../cadastro/data/cadastro";
import { flattenRp, useRpPages } from "../data/rp";
import { formatRpDay, rpStatusChipClass, rpStatusLabel, rpStatusOptions } from "../model/rp";

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

const FILTERS = ["q", "status", "factoryId", "lineId", "memberId", "line", "tag", "repeated", "from", "to"] as const;

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar">
            <TextInput
              type="search"
              value={params.get("q") ?? ""}
              placeholder="Problema, descrição ou causa raiz"
              onChange={(event) => setFilter("q", event.target.value)}
            />
          </Field>
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
        <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <ul>
            {items.map((rp) => (
              <li key={rp.id} className="border-t border-t-line first:border-t-0">
                <button
                  type="button"
                  onClick={() => navigate(`/rp/${rp.id}`)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent-soft"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                      {formatRpDay(rp.occurredAt)}
                      {place(rp, lineNames).map((part) => ` · ${part}`)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-app" title={rp.problem}>
                      {rp.problem}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {[...rp.memberIds.map((id) => memberNames.get(id)).filter(Boolean), rp.unmatchedTechnicians].filter(Boolean).join(", ") ||
                        "Sem técnico"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={rpStatusChipClass(rp.status)}>{rpStatusLabel(rp.status)}</span>
                    {rp.repeatedFailure ? <span className="text-xs font-semibold text-danger">Falha repetida</span> : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {list.hasNextPage ? (
            <div className="flex justify-center border-t border-t-line px-4 py-3">
              <Button tone="ghost" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                {list.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

