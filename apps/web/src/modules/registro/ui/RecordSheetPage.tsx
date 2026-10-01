import { Link, useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { ChamadoForm } from "../../turno/ui/ChamadoForm";
import { OcorrenciaForm } from "../../turno/ui/OcorrenciaForm";
import { useRecord } from "../data/records";
import { originLabel, recordGestorName, recordShortName } from "../model/record";
import { FeedbackSheet } from "./FeedbackSheet";
import { ProblemSheet } from "./ProblemSheet";
import { TaskSheet } from "./TaskSheet";

export function RecordSheetPage() {
  const { id = "" } = useParams();
  const record = useRecord(id);
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
        Acompanhamento
      </Link>
      {data.type === "task" ? <TaskSheet record={data} /> : null}
      {data.type === "feedback" ? <FeedbackSheet record={data} /> : null}
      {data.type === "problem" && data.origin === "chamado" ? <ChamadoForm record={data} /> : null}
      {data.type === "problem" && data.origin === "ocorrencia" ? <OcorrenciaForm record={data} /> : null}
      {data.type === "problem" && data.origin === "inbox" ? <ProblemSheet record={data} /> : null}
    </div>
  );
}
