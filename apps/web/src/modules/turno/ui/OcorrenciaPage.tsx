import { PageTitle } from "../../../design/ui/controls";
import { OcorrenciaForm } from "./OcorrenciaForm";

export function OcorrenciaPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageTitle eyebrow="Turno" title="Ocorrência" text="Fábrica, linha e texto. Grava um Problema." />
      <OcorrenciaForm />
    </div>
  );
}
