import { PageTitle } from "../../../design/ui/controls";
import { ChamadoForm } from "./ChamadoForm";

export function ChamadoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle
        eyebrow="Turno"
        title="Chamado"
        text="Número do dia, descrição, horários, duração, técnicos, máquina ou outra, status e observação. Grava um Problema."
      />
      <ChamadoForm />
    </div>
  );
}
