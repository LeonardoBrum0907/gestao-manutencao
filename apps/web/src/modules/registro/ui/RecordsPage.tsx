import { Link } from "react-router-dom";
import { Card, PageTitle } from "../../../design/ui/controls";
import { useRecords } from "../data/records";
import { formatWhen, recordGestorName, statusChipClass, statusLabel } from "../model/record";

export function RecordsPage() {
  const records = useRecords();
  return (
    <div>
      <PageTitle eyebrow="Caderno" title="Registros" text="Abra a ficha para completar o que a captura deixou de fora." />
      {records.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-3">
        {records.data?.length === 0 ? <Card>Nenhum registro ainda. Comece pela captura.</Card> : null}
        {records.data?.map((record) => (
          <Link
            key={record.id}
            to={`/registros/${record.id}`}
            className="block rounded-card border border-line bg-card p-4 shadow-card transition hover:border-accent hover:bg-chip sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {recordGestorName(record.type)}
                </p>
                <p className="mt-1 line-clamp-2 font-medium" title={record.body}>
                  {record.body}
                </p>
              </div>
              <span className={statusChipClass(record.status)}>{statusLabel(record.status)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{formatWhen(record.occurredAt)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
