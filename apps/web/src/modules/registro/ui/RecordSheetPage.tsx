import { useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { useRecord } from "../data/records";
import { recordGestorName, recordShortName } from "../model/record";
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
      <PageTitle eyebrow={recordShortName(data.type)} title={recordGestorName(data.type)} />
      {data.type === "task" ? <TaskSheet record={data} /> : null}
      {data.type === "feedback" ? <FeedbackSheet record={data} /> : null}
      {data.type === "problem" ? <ProblemSheet record={data} /> : null}
    </div>
  );
}
