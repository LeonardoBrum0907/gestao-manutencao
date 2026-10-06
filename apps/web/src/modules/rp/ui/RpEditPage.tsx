import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, Notice, PageTitle } from "../../../design/ui/controls";
import { errorMessage } from "../../../app/http";
import { useDeleteRp, useRp } from "../data/rp";
import { valuesFromRp } from "../model/rp";
import { RpForm } from "./RpForm";

export function RpEditPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const rp = useRp(id);
  const remove = useDeleteRp();
  const [confirming, setConfirming] = useState(false);

  if (rp.isPending) return <p className="text-sm text-muted">Carregando RP…</p>;
  if (!rp.data) return <p className="text-sm text-danger">RP não encontrado.</p>;
  const data = rp.data;

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Turno" title="RP" text="Ficha do Relatório Padrão. Ao gravar, o Problema ligado nas Pendências acompanha." />
      <div className="-mt-4 mb-6 flex flex-wrap items-center gap-4 text-sm font-semibold">
        <Link to="/rp" className="text-accent">
          ← RPs
        </Link>
        {data.problemRecordId ? (
          <Link to={`/registros/${data.problemRecordId}`} className="text-accent">
            Ver o Problema nas Pendências
          </Link>
        ) : null}
      </div>
      <RpForm
        id={data.id}
        initial={valuesFromRp(data)}
        rawText={data.rawText}
        submitLabel="Gravar RP"
        onSaved={() => undefined}
        extraActions={
          confirming ? (
            <span className="flex items-center gap-2 text-sm text-app">
              Excluir este RP e o Problema ligado?
              <Button
                tone="danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate(data.id, { onSuccess: () => navigate("/rp") })}
              >
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
          )
        }
      />
      {remove.isError ? (
        <div className="mt-4">
          <Notice>{errorMessage(remove.error)}</Notice>
        </div>
      ) : null}
      {data.rawText ? (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-app">Texto original colado</summary>
          <Card className="mt-3">
            <pre className="whitespace-pre-wrap break-words text-xs text-muted">{data.rawText}</pre>
          </Card>
        </details>
      ) : null}
    </div>
  );
}
