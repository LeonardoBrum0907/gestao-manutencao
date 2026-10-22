import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { PublicRpDirectoryDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { usePendingReviews, usePublicAccess, usePublicDirectory, usePublicRpPages } from "../data/public-rp";
import { publicRpPath, rememberMember, rememberedMember } from "../model/public-rp";
import { toggleSelected } from "../model/public-rp-export";
import { withoutPublicRpFilters } from "../model/public-rp-filters";
import { PublicRpFilters } from "./PublicRpFilters";
import { ExportBar, ExportIntro, ReviewBar, RpListCard } from "./PublicRpSelection";
import { deviceStorage } from "./public-rp-parts";
import { useDragSelect } from "./use-drag-select";

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

// Marcar fica sempre à mão; Exportar é um modo à parte que mostra só os aprovados (export=1 e decision=approved
// na URL, então recarregar a página volta direto para a exportação). Trocar de filtro limpa o que estava marcado.
// Fora do link de supervisor o export=1 da URL não vale: a exportação é dele.
function useListSelection(params: URLSearchParams, setFilters: (patch: Record<string, string>) => void, supervisor: boolean) {
  const [exportAsked, setExporting] = useState(params.get("export") === "1");
  const exporting = supervisor && exportAsked;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filterKey = params.toString();
  useEffect(() => setSelected(new Set()), [filterKey]);
  function startExport() {
    setExporting(true);
    setFilters({ export: "1", decision: "approved" });
  }
  function stopExport() {
    setExporting(false);
    setFilters({ export: "", decision: "" });
  }
  const toggle = (id: string) => setSelected((current) => toggleSelected(current, id));
  return { exporting, selected, setSelected, startExport, stopExport, toggle };
}

type ListHeaderProps = { code: string; supervisorName: string | null; exporting: boolean; onExport: () => void };

function ListHeader({ code, supervisorName, exporting, onExport }: ListHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-app">RPs da equipe</h1>
        {supervisorName ? <p className="text-sm text-muted">Link de supervisor: {supervisorName}</p> : null}
      </div>
      {exporting ? null : (
        <div className="flex flex-wrap gap-3">
          {supervisorName ? (
            <Button tone="ghost" onClick={onExport}>
              Exportar planilha
            </Button>
          ) : null}
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
 * Lista da página pública: só os RPs criados nela, filtráveis pelo técnico do aparelho, pelo pedido de revisão e pelos
 * filtros da lista do coordenador (menos Fábrica e Linha do texto).
 * No link de um supervisor, marcar RPs mostra a barra de aprovar, recusar ou pedir revisão, e Exportar planilha mostra só
 * os aprovados para baixar. No link da equipe nada disso aparece (e a API recusa).
 * @example <Route index element={<PublicRpListPage />} />
 */
export function PublicRpListPage() {
  const { code = "" } = useParams();
  const [params, setParams] = useSearchParams();
  useRememberedMemberParam(params, setParams);
  const directory = usePublicDirectory(code);
  const access = usePublicAccess(code);
  const supervisorName = access.data?.role === "supervisor" ? access.data.supervisorName : null;
  const list = usePublicRpPages(code, params);
  const memberId = params.get("memberId") ?? "";
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const lineNames = new Map(directory.data?.lines.map((line) => [line.id, line.name]));

  function setFilters(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if ("memberId" in patch) rememberMember(deviceStorage(), patch.memberId ?? "");
    setParams(next, { replace: true });
  }
  const setFilter = (key: string, value: string) => setFilters({ [key]: value });
  const selection = useListSelection(params, setFilters, Boolean(supervisorName));
  const drag = useDragSelect({ ids: items.map((rp) => rp.id), selected: selection.selected, onChange: selection.setSelected });

  if (directory.isError) return <Notice>{errorMessage(directory.error)}</Notice>;

  return (
    <div className="flex flex-col gap-4">
      <ListHeader code={code} supervisorName={supervisorName} exporting={selection.exporting} onExport={selection.startExport} />
      {selection.exporting ? (
        <ExportIntro
          shown={items.length}
          selected={items.filter((rp) => selection.selected.has(rp.id)).length}
          onSelectAll={() => selection.setSelected(new Set(items.map((rp) => rp.id)))}
          onClear={() => selection.setSelected(new Set())}
          onCancel={selection.stopExport}
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
          <PublicRpFilters
            params={params}
            setFilter={setFilter}
            exporting={selection.exporting}
            lines={directory.data?.lines ?? []}
            onClear={() => setParams(withoutPublicRpFilters(params, selection.exporting), { replace: true })}
          />
        </div>
      </Card>
      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando RPs…</p> : null}
      {list.isSuccess && !items.length ? (
        <p className="text-sm text-muted">{params.toString() ? "Nenhum RP com esses filtros." : "Nenhum RP por aqui ainda."}</p>
      ) : null}
      {supervisorName && items.length && !selection.exporting && !selection.selected.size ? (
        <p className="text-xs text-muted sm:hidden">Toque e segure um RP para marcar vários.</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((rp) => (
          <RpListCard
            key={rp.id}
            code={code}
            rp={rp}
            lineNames={lineNames}
            selectable={Boolean(supervisorName)}
            checked={selection.selected.has(rp.id)}
            selecting={selection.exporting || selection.selected.size > 0}
            onToggle={() => selection.toggle(rp.id)}
            onHold={() => drag.begin(rp.id)}
          />
        ))}
      </ul>
      {list.hasNextPage ? (
        <Button tone="ghost" onClick={() => void list.fetchNextPage()} disabled={list.isFetchingNextPage}>
          {list.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      ) : null}
      {selection.exporting ? <ExportBar code={code} selected={selection.selected} directory={directory.data} responsible={supervisorName ?? ""} /> : null}
      {supervisorName && !selection.exporting && selection.selected.size ? (
        <ReviewBar code={code} selected={selection.selected} onClear={() => selection.setSelected(new Set())} />
      ) : null}
    </div>
  );
}
