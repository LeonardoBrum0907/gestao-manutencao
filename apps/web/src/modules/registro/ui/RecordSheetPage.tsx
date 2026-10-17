import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { OcorrenciaForm } from "../../turno/ui/OcorrenciaForm";
import { useRpOfProblem } from "../../rp/data/rp";
import { useRecord } from "../data/records";
import { originLabel } from "../model/record";
import { sheetRedirect } from "../model/sheet-redirect";
import { RecordRemoveDialog } from "./RecordRemoveDialog";

// Problema de RP cujo RP ainda está sendo procurado ou não existe mais (achado, a ficha abre o RP).
function RpMirror({ pending }: { pending: boolean }) {
  return (
    <div className="rounded-card border border-line bg-card p-4 text-sm text-app shadow-card sm:p-5">
      {pending ? <p className="text-muted">Procurando o RP deste problema…</p> : <p>Este problema vem de um RP, mas o RP não foi encontrado.</p>}
    </div>
  );
}

// Problema de ocorrência ou de RP (o resto abre no modal de Registros ou na tela de Chamados).
export function RecordSheetPage() {
  const { id = "" } = useParams();
  const record = useRecord(id);
  const rp = useRpOfProblem(id, record.data?.origin === "rp");
  const navigate = useNavigate();
  const [removing, setRemoving] = useState(false);
  if (record.isPending) return <p className="text-sm text-muted">Carregando ficha…</p>;
  if (!record.data) return <p className="text-sm text-danger">Registro não encontrado.</p>;
  const data = record.data;
  const redirect = sheetRedirect(data, rp.data?.id ?? null);
  if (redirect) return <Navigate to={redirect} replace />;
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        eyebrow="Problema"
        title={originLabel(data.origin)}
        crumb={`Problema (${originLabel(data.origin)})`}
        back={{ to: "/registros", label: "Registros" }}
      />
      {data.origin === "ocorrencia" ? <OcorrenciaForm record={data} /> : null}
      {data.origin === "rp" ? <RpMirror pending={rp.isPending} /> : null}
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
          onDeleted={() => navigate("/registros", { replace: true })}
        />
      ) : null}
    </div>
  );
}
