import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { errorMessage } from "../../../app/http";
import { Button, Notice, PageTitle } from "../../../design/ui/controls";
import { useMachines } from "../../cadastro/data/cadastro";
import { todayIso } from "../../colaborador/model/pdi-items";
import { useDeletePostPreventive, usePostPreventive } from "../data/post-preventives";
import { emptyValues, valuesFromDto } from "../model/post-preventive";
import { PostPreventiveForm } from "./PostPreventiveForm";

const TEXT = "Ocorrência que apareceu depois de uma preventiva, a ação para não repetir e o ponto de atenção que vai na folha do técnico.";

// Ficha nova: pode chegar com ?maquina= vindo da tela da máquina.
export function NewPostPreventivePage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const machines = useMachines();
  const machineId = search.get("maquina") ?? "";
  if (machineId && machines.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  const machine = machines.data?.find((item) => item.id === machineId);

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Turno" title="Nova ficha pós-preventiva" text={TEXT} />
      <div className="-mt-4 mb-6 text-sm font-semibold">
        <Link to={machine ? `/maquinas/${machine.id}` : "/pos-preventiva"} className="text-accent">
          ← {machine ? machine.name : "Pós-preventiva"}
        </Link>
      </div>
      <PostPreventiveForm
        initial={emptyValues(todayIso(), machine ? { lineId: machine.lineId, machineId: machine.id } : {})}
        onSaved={(item) => navigate(`/pos-preventiva/${item.id}`, { replace: true })}
      />
    </div>
  );
}

export function PostPreventivePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const item = usePostPreventive(id);
  const remove = useDeletePostPreventive();
  const [confirming, setConfirming] = useState(false);

  if (item.isPending) return <p className="text-sm text-muted">Carregando ficha…</p>;
  if (!item.data) return <p className="text-sm text-danger">Ficha não encontrada.</p>;
  const data = item.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Turno" title="Ficha pós-preventiva" text={TEXT} />
      <div className="-mt-4 mb-6 flex flex-wrap items-center gap-4 text-sm font-semibold">
        <Link to="/pos-preventiva" className="text-accent">
          ← Pós-preventiva
        </Link>
        <Link to={`/maquinas/${data.machineId}`} className="text-accent">
          Tela da máquina
        </Link>
      </div>
      <PostPreventiveForm
        key={data.id}
        id={data.id}
        initial={valuesFromDto(data)}
        onSaved={() => undefined}
        extraActions={
          <>
            <Link
              to={`/maquinas/${data.machineId}/folha?ficha=${data.id}`}
              className="inline-flex items-center justify-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft"
            >
              Exportar
            </Link>
            {confirming ? (
              <span className="flex items-center gap-2 text-sm text-app">
                Excluir esta ficha?
                <Button tone="danger" disabled={remove.isPending} onClick={() => remove.mutate(data.id, { onSuccess: () => navigate("/pos-preventiva") })}>
                  Sim, excluir
                </Button>
                <Button tone="ghost" onClick={() => setConfirming(false)}>
                  Não
                </Button>
              </span>
            ) : (
              <Button tone="ghost" onClick={() => setConfirming(true)}>
                Excluir
              </Button>
            )}
          </>
        }
      />
      {remove.isError ? (
        <div className="mt-4">
          <Notice>{errorMessage(remove.error)}</Notice>
        </div>
      ) : null}
    </div>
  );
}
