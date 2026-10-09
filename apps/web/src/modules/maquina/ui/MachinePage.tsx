import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, PageTitle, SectionTitle } from "../../../design/ui/controls";
import { useFactories, useLines, useMachines, useSubassemblies } from "../../cadastro/data/cadastro";
import { machineStatusClass, machineStatusLabel } from "../../cadastro/model/labels";
import { MachineFormModal } from "../../cadastro/ui/MachineFormModal";
import { formatDay } from "../../colaborador/model/pdi-items";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { usePostPreventives } from "../../pos-preventiva/data/post-preventives";
import { groupBySubassembly } from "../../pos-preventiva/model/post-preventive";
import { AttentionChip } from "../../pos-preventiva/ui/PostPreventiveListPage";
import { flattenRp, useRpPages } from "../../rp/data/rp";
import { formatRpDay, rpStatusChipClass, rpStatusLabel } from "../../rp/model/rp";
import { useChamadosOfLine } from "../../turno/data/shift";
import { chamadoHref, chamadoStatusChipClass, chamadoStatusLabel, shortDay } from "../../turno/model/chamado";

const linkButton =
  "inline-flex items-center justify-center rounded-control px-4 py-2.5 text-sm font-semibold transition";
const RECENT_RPS = 8;

function RecentRps({ lineId }: { lineId: string }) {
  const rps = useRpPages(new URLSearchParams({ lineId }));
  const items = flattenRp(rps.data?.pages).slice(0, RECENT_RPS);
  if (rps.isPending) return <p className="text-sm text-muted">Carregando RPs…</p>;
  if (!items.length) return <p className="text-sm text-muted">Nenhum RP nesta linha.</p>;
  return (
    <ul className="flex flex-col">
      {items.map((rp) => (
        <li key={rp.id} className="border-t border-t-line first:border-t-0">
          <Link to={`/rp/${rp.id}`} className="flex items-start justify-between gap-3 py-2 text-sm transition hover:text-accent">
            <span className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{formatRpDay(rp.occurredAt)}</span>
              <span className="mt-0.5 line-clamp-2 block text-app">{rp.problem}</span>
            </span>
            <span className={`${rpStatusChipClass(rp.status)} shrink-0`}>{rpStatusLabel(rp.status)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const RECENT_CHAMADOS = 8;

// Chamados da linha; os desta máquina aparecem com o nome dela.
function RecentChamados({ lineId, machineId }: { lineId: string; machineId: string }) {
  const chamados = useChamadosOfLine(lineId, RECENT_CHAMADOS);
  const items = chamados.data ?? [];
  if (chamados.isPending) return <p className="text-sm text-muted">Carregando chamados…</p>;
  if (!items.length) return <p className="text-sm text-muted">Nenhum chamado nesta linha.</p>;
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id} className="border-t border-t-line first:border-t-0">
          <Link to={chamadoHref(item)} className="flex items-start justify-between gap-3 py-2 text-sm transition hover:text-accent">
            <span className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                {shortDay(item.day)}
                {item.machineId === machineId ? " · esta máquina" : ""}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-app">{item.body}</span>
            </span>
            <span className={`${chamadoStatusChipClass(item.status)} shrink-0`}>{chamadoStatusLabel(item.status)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MachinePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const machines = useMachines();
  const lines = useLines();
  const factories = useFactories();
  const subassemblies = useSubassemblies();
  const catalog = useMatrixCatalog();
  const records = usePostPreventives({ machineId: id });
  const [editing, setEditing] = useState(false);

  if (machines.isPending || lines.isPending) return <p className="text-sm text-muted">Carregando máquina…</p>;
  const machine = machines.data?.find((item) => item.id === id);
  const line = lines.data?.find((item) => item.id === machine?.lineId);
  if (!machine || !line) return <Card>Máquina não encontrada.</Card>;

  const factory = factories.data?.find((item) => item.id === line.factoryId);
  const model = catalog.data?.equipments.find((item) => item.id === machine.equipmentId);
  const items = records.data ?? [];
  const active = groupBySubassembly(
    items.filter((item) => item.attentionActive),
    subassemblies.data ?? [],
  );
  const subassemblyNames = new Map(subassemblies.data?.map((item) => [item.id, item.name]));
  const facts = [
    model ? `Modelo ${model.name}` : "Sem modelo de equipamento",
    machine.tag ? `TAG ${machine.tag}` : null,
    machine.manufacturer,
  ].filter(Boolean);

  return (
    <div>
      <PageTitle
        eyebrow={[factory?.name, line.name].filter(Boolean).join(" · ")}
        title={machine.name}
        text={facts.join(" · ")}
        back={{ to: "/maquinas", label: "Máquinas" }}
        action={
          <div className="flex flex-wrap gap-2">
            <Button tone="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Link to={`/maquinas/${machine.id}/folha`} className={`${linkButton} border border-line bg-chip text-app hover:bg-accent-soft`}>
              Exportar folha
            </Link>
            <Link to={`/pos-preventiva/nova?maquina=${machine.id}`} className={`${linkButton} bg-accent text-accent-contrast hover:brightness-90`}>
              Nova ficha
            </Link>
          </div>
        }
      />
      <div className="-mt-4 mb-6 flex flex-wrap items-center gap-4 text-sm">
        <span>
          Status: <span className={machineStatusClass(machine.status) || "text-app"}>{machineStatusLabel(machine.status)}</span>
        </span>
      </div>
      {machine.notes ? (
        <Card className="mb-4">
          <p className="whitespace-pre-wrap text-sm text-app">{machine.notes}</p>
        </Card>
      ) : null}
      {records.isError ? <Notice>{errorMessage(records.error)}</Notice> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle title="Pontos de atenção ativos" text="O que o técnico precisa conferir na próxima preventiva, por subconjunto." />
            {records.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
            {records.isSuccess && !active.length ? <p className="text-sm text-muted">Nenhum ponto de atenção ativo.</p> : null}
            <div className="flex flex-col gap-4">
              {active.map((group) => (
                <div key={group.subassemblyId}>
                  <h3 className="mb-2 rounded-control bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent">{group.name}</h3>
                  <ul className="flex flex-col gap-2">
                    {group.items.map((item) => (
                      <li key={item.id} className="px-1">
                        <Link to={`/pos-preventiva/${item.id}`} className="block text-sm font-medium text-app hover:text-accent">
                          {item.attentionPoint}
                        </Link>
                        <p className="text-xs text-muted">
                          Preventiva de {formatDay(item.preventiveDate)} · Ocorrência: {item.occurrence}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Histórico pós-preventiva" text="Todas as fichas desta máquina, da mais recente para a mais antiga." />
            {records.isSuccess && !items.length ? <p className="text-sm text-muted">Nenhuma ficha ainda.</p> : null}
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id} className="border-t border-t-line first:border-t-0">
                  <Link to={`/pos-preventiva/${item.id}`} className="flex items-start justify-between gap-3 py-2 transition hover:text-accent">
                    <span className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                        {formatDay(item.preventiveDate)} · {subassemblyNames.get(item.subassemblyId) ?? "Subconjunto"}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-app">{item.occurrence}</span>
                    </span>
                    <span className="shrink-0">
                      <AttentionChip active={item.attentionActive} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <Card className="self-start">
          <SectionTitle
            title={`RPs da linha ${line.name}`}
            action={
              <Link to={`/rp?lineId=${line.id}`} className="text-sm font-semibold text-accent hover:underline">
                Ver todos
              </Link>
            }
          />
          <RecentRps lineId={line.id} />
          <div className="mt-6">
            <SectionTitle
              title={`Chamados da linha ${line.name}`}
              action={
                <Link to={`/turno/chamados?linha=${line.id}`} className="text-sm font-semibold text-accent hover:underline">
                  Abrir Chamados
                </Link>
              }
            />
            <RecentChamados lineId={line.id} machineId={machine.id} />
          </div>
        </Card>
      </div>
      {editing ? (
        <MachineFormModal line={line} machine={machine} onClose={() => setEditing(false)} onDeleted={() => navigate("/maquinas", { replace: true })} />
      ) : null}
    </div>
  );
}
