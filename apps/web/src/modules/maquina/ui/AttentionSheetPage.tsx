import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { PostPreventiveDto } from "@manutencao/shared";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { usePreviewZoom, ZoomControls } from "../../../design/ui/sheet-preview";
import { useLines, useMachines, useMembers, useSubassemblies } from "../../cadastro/data/cadastro";
import { formatDay } from "../../colaborador/model/pdi-items";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { usePostPreventive, usePostPreventives } from "../../pos-preventiva/data/post-preventives";
import { groupBySubassembly } from "../../pos-preventiva/model/post-preventive";
import "../../../design/ui/report.css";
import "./attention-sheet.css";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function Point({ item, memberNames, full }: { item: PostPreventiveDto; memberNames: Map<string, string>; full: boolean }) {
  return (
    <div className="point">
      <span className="box" aria-hidden />
      <div>
        <p className="attention">{item.attentionPoint}</p>
        <p className="muted">
          <b>Ocorrência:</b> {item.occurrence} (preventiva de {formatDay(item.preventiveDate)}
          {item.occurrenceDate ? `, ocorreu em ${formatDay(item.occurrenceDate)}` : ""})
        </p>
        <p className="muted">
          <b>Ação preventiva:</b> {item.preventiveAction}
        </p>
        {full ? (
          <>
            <p className="muted">
              <b>O que foi feito na preventiva:</b> {item.done}
            </p>
            <p className="muted">
              <b>Técnicos:</b> {item.memberIds.map((id) => memberNames.get(id)).filter(Boolean).join(", ") || "—"}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

// Folha A4 da máquina para o técnico levar na próxima preventiva: os pontos de atenção ativos por subconjunto.
// Com ?ficha= sai uma ficha só (ativa ou não), com o que foi feito e os técnicos.
export function AttentionSheetPage() {
  const { id = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const recordId = search.get("ficha") ?? "";
  const preview = usePreviewZoom();
  const machines = useMachines();
  const lines = useLines();
  const members = useMembers();
  const subassemblies = useSubassemblies();
  const catalog = useMatrixCatalog();
  const active = usePostPreventives({ machineId: id, active: "true" }, !recordId);
  const single = usePostPreventive(recordId);

  const machine = machines.data?.find((item) => item.id === id);
  const line = lines.data?.find((item) => item.id === machine?.lineId);
  const items = recordId ? (single.data ? [single.data] : []) : (active.data ?? []);
  const groups = groupBySubassembly(items, subassemblies.data ?? []);
  const skipped = new Set((search.get("sem") ?? "").split(",").filter(Boolean));
  const shown = groups.filter((group) => !skipped.has(group.subassemblyId));
  const memberNames = new Map(members.data?.map((member) => [member.id, member.name]));
  const loading = machines.isPending || lines.isPending || (recordId ? single.isPending : active.isPending);
  const { fit } = preview;

  // A folha só aparece depois dos dados: ajusta o zoom quando ela entra na tela.
  useEffect(() => {
    if (!loading) fit();
  }, [loading, fit]);

  if (loading) return <p className="text-sm text-muted">Carregando…</p>;
  if (!machine || !line) return <Card>Máquina não encontrada.</Card>;
  const model = catalog.data?.equipments.find((item) => item.id === machine.equipmentId);
  const failed = recordId ? single.isError : active.isError;

  function toggle(subassemblyId: string) {
    const next = new Set(skipped);
    if (next.has(subassemblyId)) next.delete(subassemblyId);
    else next.add(subassemblyId);
    const params = new URLSearchParams(search);
    if (next.size) params.set("sem", [...next].join(","));
    else params.delete("sem");
    setSearch(params, { replace: true });
  }

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to={recordId ? `/pos-preventiva/${recordId}` : `/maquinas/${machine.id}`} className="text-sm font-medium text-accent hover:underline">
          ← {recordId ? "Voltar à ficha" : "Voltar à máquina"}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ZoomControls preview={preview} />
          <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
        </div>
      </div>
      {!recordId && groups.length > 1 ? (
        <Card className="no-print mb-3" compact>
          <p className="mb-2 text-sm font-medium text-app">Subconjuntos na folha</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {groups.map((group) => (
              <label key={group.subassemblyId} className="flex items-center gap-2 text-sm text-app">
                <input type="checkbox" checked={!skipped.has(group.subassemblyId)} onChange={() => toggle(group.subassemblyId)} />
                {group.name} ({group.items.length})
              </label>
            ))}
          </div>
        </Card>
      ) : null}
      <p className="no-print mb-3 text-xs text-muted">
        Esta é a folha A4 como sai no PDF. Na janela de impressão, escolha “Salvar como PDF” ou mande direto para a impressora.
      </p>
      {failed ? <Notice>Não foi possível carregar as fichas.</Notice> : null}
      <div ref={preview.frame} className="report-frame">
        <div className="report-zoom" style={{ zoom: preview.zoom }}>
          <div ref={preview.sheet} className="report-sheet">
            <article className="report attention-sheet" data-theme="light">
              <header className="hero">
                <div>
                  <p className="brand">Gestão de Manutenção · {recordId ? "Ficha pós-preventiva" : "Pontos de atenção para a preventiva"}</p>
                  <h1>{machine.name}</h1>
                  <p className="sub">{[line.name, machine.tag ? `TAG ${machine.tag}` : null, model?.name].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="meta">
                  <b>Preventiva em ___/___/______</b>
                  Gerado em {dateFormat.format(new Date())}
                </div>
              </header>
              <div className="stripe" />
              <div className="content">
                {shown.length ? (
                  shown.map((group) => (
                    <section key={group.subassemblyId}>
                      <h2>{group.name}</h2>
                      {group.items.map((item) => (
                        <Point key={item.id} item={item} memberNames={memberNames} full={Boolean(recordId)} />
                      ))}
                    </section>
                  ))
                ) : (
                  <p className="muted">Nenhum ponto de atenção ativo nesta máquina.</p>
                )}
                <h2>Conferência do técnico</h2>
                <div className="sign">
                  <div>
                    <small>Técnico(s)</small>
                  </div>
                  <div>
                    <small>Assinatura</small>
                  </div>
                  <div className="wide">
                    <small>Observações</small>
                  </div>
                </div>
              </div>
              <footer>
                <span>
                  Gestão de Manutenção · {line.name} · {machine.name}
                </span>
                <span>Gerado em {dateFormat.format(new Date())}</span>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
