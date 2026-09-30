import { Link } from "react-router-dom";
import { Card, PageTitle } from "../../../design/ui/controls";
import { useRecords } from "../data/records";
import { formatWhen, recordGestorName, statusLabel } from "../model/record";

export function RecordsPage() {
  const records = useRecords();
  return (
    <div>
      <PageTitle eyebrow="Caderno" title="Registros" text="Abra a ficha para completar o que a captura deixou de fora." />
      <div className="flex flex-col gap-3">
        {records.data?.length === 0 ? <Card>Nenhum registro ainda. Comece pela captura.</Card> : null}
        {records.data?.map((record) => (
          <Link key={record.id} to={`/registros/${record.id}`} className="block">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {recordGestorName(record.type)}
                  </p>
                  <p className="mt-1 font-medium">{record.body}</p>
                </div>
                <span className="rounded-control bg-chip px-2 py-1 text-xs font-medium text-app">
                  {statusLabel(record.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{formatWhen(record.occurredAt)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
