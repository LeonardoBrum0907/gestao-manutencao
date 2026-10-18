import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { PublicRpDirectoryDto, PublicRpListItemDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextInput } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { formatRpDay, rpStatusChipClass, rpStatusLabel, rpStatusOptions } from "../../rp/model/rp";
import { usePendingReviews, usePublicDirectory, usePublicRpPages } from "../data/public-rp";
import { placeOf, publicRpPath, rememberMember, rememberedMember } from "../model/public-rp";
import { toggleSelected } from "../model/public-rp-export";
import { ApprovedBadge, ExportBar, ExportIntro, SelectableRpCard } from "./PublicRpExport";
import { deviceStorage, ReviewBadge } from "./public-rp-parts";

function RpCard({ code, rp, lineNames }: { code: string; rp: PublicRpListItemDto; lineNames: ReadonlyMap<string, string> }) {
  return (
    <li>
      <Link to={publicRpPath(code, rp.id)} className="flex flex-col gap-1.5 rounded-card border border-line bg-card p-4 shadow-card transition hover:border-accent">
        <span className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{[formatRpDay(rp.occurredAt), ...placeOf(rp, lineNames)].join(" · ")}</span>
          <span className="flex items-center gap-2">
            {rp.reviewRequested ? <ReviewBadge /> : null}
            {rp.approved ? <ApprovedBadge /> : null}
            <span className={rpStatusChipClass(rp.status)}>{rpStatusLabel(rp.status)}</span>
          </span>
        </span>
        <span className="line-clamp-2 text-sm text-app">{rp.problem}</span>
        <span className="text-xs text-muted">{rp.memberNames.join(", ") || "Sem técnico"}</span>
      </Link>
    </li>
  );
}

// "Quem sou": o aparelho lembra, e a lista abre nos RPs da pessoa. Não é login.
function MemberPicker({ members, value, onChange }: { members: PublicRpDirectoryDto["members"]; value: string; onChange: (id: string) => void }) {
  return (
    <Field label="Quem sou">
      <SelectInput value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Ver de todos</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}

function PendingButton({ code, memberId, active, onToggle }: { code: string; memberId: string; active: boolean; onToggle: () => void }) {
  const pending = usePendingReviews(code, memberId);
  const count = pending.data?.items.length ?? 0;
  if (!memberId || (!count && !active)) return null;
  return (
    <Button tone={active ? "primary" : "ghost"} onClick={onToggle}>
      {active ? "Ver todos os meus" : `${count}${pending.data?.nextCursor ? "+" : ""} para revisar`}
    </Button>
  );
}

function useRememberedMemberParam(params: URLSearchParams, setParams: (next: URLSearchParams, options: { replace: boolean }) => void) {
  useEffect(() => {
    if (params.has("memberId")) return;
    const memberId = rememberedMember(deviceStorage());
    if (!memberId) return;
    const next = new URLSearchParams(params);
    next.set("memberId", memberId);
    setParams(next, { replace: true });
    // Só na chegada: depois quem manda é o que a pessoa escolhe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function Filters({ params, setFilter }: { params: URLSearchParams; setFilter: (key: string, value: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
      <Field label="Buscar">
        <TextInput type="search" value={params.get("q") ?? ""} placeholder="Problema, descrição ou causa" onChange={(event) => setFilter("q", event.target.value)} />
      </Field>
    </div>
  );
}

// Modo de exportar: a lista passa a mostrar só os aprovados (checked=true) e o toque marca em vez de abrir.
// Quem recarrega a página com checked=true na URL volta direto para o modo de exportar.
function useExportMode(params: URLSearchParams, setFilter: (key: string, value: string) => void) {
  const [exporting, setExporting] = useState(params.get("checked") === "true");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function start() {
    setExporting(true);
    setFilter("checked", "true");
  }
  function stop() {
    setExporting(false);
    setSelected(new Set());
    setFilter("checked", "");
  }
  const toggle = (id: string) => setSelected((current) => toggleSelected(current, id));
  return { exporting, selected, setSelected, start, stop, toggle };
}

function ListHeader({ code, exporting, onExport }: { code: string; exporting: boolean; onExport: () => void }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-serif text-2xl font-semibold text-app">RPs da equipe</h1>
      {exporting ? null : (
        <div className="flex flex-wrap gap-3">
          <Button tone="ghost" onClick={onExport}>
            Exportar planilha
          </Button>
          <Link
            to={publicRpPath(code, "novo")}
            className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
          >
            <Icon name="plus" />
            Novo relatório padrão
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Lista da página pública: só os RPs criados nela, filtráveis pelo técnico do aparelho e pelo pedido de revisão.
 * No modo de exportar, o supervisor marca RPs aprovados e baixa a planilha.
 * @example <Route index element={<PublicRpListPage />} />
 */
export function PublicRpListPage() {
  const { code = "" } = useParams();
  const [params, setParams] = useSearchParams();
  useRememberedMemberParam(params, setParams);
  const directory = usePublicDirectory(code);
  const list = usePublicRpPages(code, params);
  const memberId = params.get("memberId") ?? "";
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const lineNames = new Map(directory.data?.lines.map((line) => [line.id, line.name]));

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "memberId") rememberMember(deviceStorage(), value);
    setParams(next, { replace: true });
  }
  const exportMode = useExportMode(params, setFilter);

  if (directory.isError) return <Notice>{errorMessage(directory.error)}</Notice>;

  return (
    <div className="flex flex-col gap-4">
      <ListHeader code={code} exporting={exportMode.exporting} onExport={exportMode.start} />
      {exportMode.exporting ? (
        <ExportIntro
          shown={items.length}
          selected={items.filter((rp) => exportMode.selected.has(rp.id)).length}
          onSelectAll={() => exportMode.setSelected(new Set(items.map((rp) => rp.id)))}
          onClear={() => exportMode.setSelected(new Set())}
          onCancel={exportMode.stop}
        />
      ) : null}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <MemberPicker members={directory.data?.members ?? []} value={memberId} onChange={(id) => setFilter("memberId", id)} />
            </div>
            <PendingButton code={code} memberId={memberId} active={params.get("review") === "pending"} onToggle={() => setFilter("review", params.get("review") ? "" : "pending")} />
          </div>
          <Filters params={params} setFilter={setFilter} />
        </div>
      </Card>
      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando RPs…</p> : null}
      {list.isSuccess && !items.length ? (
        <p className="text-sm text-muted">{exportMode.exporting ? "Nenhum RP aprovado com esses filtros." : "Nenhum RP por aqui ainda."}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((rp) =>
          exportMode.exporting ? (
            <SelectableRpCard key={rp.id} rp={rp} lineNames={lineNames} checked={exportMode.selected.has(rp.id)} onToggle={() => exportMode.toggle(rp.id)} />
          ) : (
            <RpCard key={rp.id} code={code} rp={rp} lineNames={lineNames} />
          ),
        )}
      </ul>
      {list.hasNextPage ? (
        <Button tone="ghost" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          {list.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      ) : null}
      {exportMode.exporting ? <ExportBar code={code} selected={exportMode.selected} directory={directory.data} /> : null}
    </div>
  );
}
