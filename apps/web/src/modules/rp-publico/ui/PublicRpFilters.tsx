import { RP_PUBLIC_DECISION_LABELS, RP_PUBLIC_DECISIONS } from "@manutencao/shared";
import { Field, SelectInput, TextInput } from "../../../design/ui/controls";
import { rpStatusOptions } from "../../rp/model/rp";

// Na exportação a avaliação fica presa em Aprovado: o filtro some para ninguém trocar sem querer.
export function PublicRpFilters({ params, setFilter, exporting }: { params: URLSearchParams; setFilter: (key: string, value: string) => void; exporting: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Status da máquina">
        <SelectInput value={params.get("status") ?? ""} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">Todos</option>
          {rpStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </Field>
      {exporting ? null : (
        <Field label="Avaliação do supervisor">
          <SelectInput value={params.get("decision") ?? ""} onChange={(event) => setFilter("decision", event.target.value)}>
            <option value="">Todas</option>
            {RP_PUBLIC_DECISIONS.map((decision) => (
              <option key={decision} value={decision}>
                {RP_PUBLIC_DECISION_LABELS[decision]}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      <Field label="Buscar">
        <TextInput type="search" value={params.get("q") ?? ""} placeholder="Problema, descrição ou causa" onChange={(event) => setFilter("q", event.target.value)} />
      </Field>
    </div>
  );
}
