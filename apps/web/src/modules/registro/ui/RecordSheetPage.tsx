import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { ChamadoForm } from "../../turno/ui/ChamadoForm";
import { OcorrenciaForm } from "../../turno/ui/OcorrenciaForm";
import { useRpOfProblem } from "../../rp/data/rp";
import { useRecord } from "../data/records";
import { originLabel, recordGestorName, recordShortName } from "../model/record";
import { FeedbackSheet } from "./FeedbackSheet";
import { RecordRemoveDialog } from "./RecordRemoveDialog";
import { ProblemSheet } from "./ProblemSheet";
import { TaskSheet } from "./TaskSheet";

// O Problema de um RP é só o espelho: a ficha de verdade é a do RP.
function RpMirror({ recordId }: { recordId: string }) {
  const rp = useRpOfProblem(recordId, true);
  return (
    <div className="rounded-card border border-line bg-card p-4 text-sm text-app shadow-card sm:p-5">
      <p>Este problema vem de um RP. Para alterar, abra a ficha do RP.</p>
      {rp.data ? (
        <Link to={`/rp/${rp.data.id}`} className="mt-3 inline-flex font-semibold text-accent">
          Abrir o RP →
        </Link>
      ) : rp.isPending ? (
        <p className="mt-3 text-muted">Procurando o RP…</p>
      ) : (
        <p className="mt-3 text-muted">O RP deste problema não foi encontrado.</p>
      )}
    </div>
  );
}

export function RecordSheetPage() {
  const { id = "" } = useParams();
  const record = useRecord(id);
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  if (record.isPending) return <p className="text-sm text-muted">Carregando ficha…</p>;
  if (!record.data) return <p className="text-sm text-danger">Registro não encontrado.</p>;
  const data = record.data;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        eyebrow={data.origin === "inbox" ? recordShortName(data.type) : "Problema"}
        title={data.origin === "inbox" ? recordGestorName(data.type) : originLabel(data.origin)}
      />
      <Link to="/acompanhamento" className="-mt-4 mb-6 inline-flex text-sm font-semibold text-accent">
        ← Pendências
      </Link>
      {data.type === "task" ? <TaskSheet record={data} /> : null}
      {data.type === "feedback" ? <FeedbackSheet record={data} /> : null}
      {data.type === "problem" && data.origin === "chamado" ? <ChamadoForm record={data} /> : null}
      {data.type === "problem" && data.origin === "ocorrencia" ? <OcorrenciaForm record={data} /> : null}
      {data.type === "problem" && data.origin === "rp" ? <RpMirror recordId={data.id} /> : null}
      {data.type === "problem" && data.origin === "inbox" ? <ProblemSheet record={data} /> : null}
      <div className="mt-6 flex justify-end border-t border-line pt-4">
        <button
          type="button"
          onClick={() => setRemoving(true)}
          className="rounded-control px-2 py-2 text-sm font-semibold text-danger transition hover:bg-danger-soft"
        >
          Excluir registro…
        </button>
      </div>
      {removing ? (
        <RecordRemoveDialog
          record={data}
          onCancel={() => setRemoving(false)}
          onDeleted={() => navigate("/acompanhamento", { replace: true })}
        />
      ) : null}
    </div>
  );
}
