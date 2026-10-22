import { useState, type InputHTMLAttributes } from "react";
import { RP_PUBLIC_DECISION_LABELS, RP_PUBLIC_DECISIONS, type PublicRpDirectoryDto } from "@manutencao/shared";
import { moreFiltersLabel } from "../../../design/more-filters";
import { Button, Field, SelectInput, TextInput } from "../../../design/ui/controls";
import { rpStatusOptions } from "../../rp/model/rp";
import { hasPublicRpFilters, hiddenPublicRpFiltersInUse, type PublicRpFilterKey } from "../model/public-rp-filters";

type Choice = { value: string; label: string };
type FilterInput = { params: URLSearchParams; setFilter: (key: string, value: string) => void };

const decisionChoices: Choice[] = RP_PUBLIC_DECISIONS.map((decision) => ({ value: decision, label: RP_PUBLIC_DECISION_LABELS[decision] }));
const repeatedChoices: Choice[] = [
  { value: "true", label: "Só repetidas" },
  { value: "false", label: "Só as que não se repetiram" },
];

// Sem o filtro de Fábrica, linhas de mesmo nome em fábricas diferentes se separam pelo código interno, como no formulário.
function lineChoices(lines: PublicRpDirectoryDto["lines"]): Choice[] {
  return lines.map((line) => ({ value: line.id, label: line.internalCode ? `${line.name} · ${line.internalCode}` : line.name }));
}

type ChoiceFilterProps = FilterInput & { name: PublicRpFilterKey; label: string; all: string; choices: Choice[] };

function ChoiceFilter({ params, setFilter, name, label, all, choices }: ChoiceFilterProps) {
  return (
    <Field label={label}>
      <SelectInput value={params.get(name) ?? ""} onChange={(event) => setFilter(name, event.target.value)}>
        <option value="">{all}</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}

type TextFilterProps = FilterInput & { name: PublicRpFilterKey; label: string } & Pick<InputHTMLAttributes<HTMLInputElement>, "type" | "placeholder">;

function TextFilter({ params, setFilter, name, label, type, placeholder }: TextFilterProps) {
  return (
    <Field label={label}>
      <TextInput type={type} value={params.get(name) ?? ""} placeholder={placeholder} onChange={(event) => setFilter(name, event.target.value)} />
    </Field>
  );
}

type PublicRpFiltersProps = FilterInput & { exporting: boolean; lines: PublicRpDirectoryDto["lines"]; onClear: () => void };

/**
 * Filtros da lista pública: os da lista do coordenador, menos Fábrica e Linha do texto. No celular só Buscar fica
 * à vista; o resto abre em "Mais filtros", como na lista do app. Na exportação a avaliação fica presa em Aprovado
 * e o filtro some para ninguém trocar sem querer.
 * @example <PublicRpFilters params={params} setFilter={setFilter} exporting={false} lines={directory.lines} onClear={clear} />
 */
export function PublicRpFilters({ params, setFilter, exporting, lines, onClear }: PublicRpFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const input = { params, setFilter };
  return (
    <div className="flex flex-col gap-4">
      <div id="rp-publico-filtros" className={`grid gap-4 sm:grid-cols-2 md:grid-cols-3 ${moreOpen ? "" : "max-sm:[&>label:nth-of-type(n+2)]:hidden"}`}>
        <TextFilter {...input} name="q" label="Buscar" type="search" placeholder="Problema, descrição ou causa" />
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="rp-publico-filtros"
          onClick={() => setMoreOpen((open) => !open)}
          className="order-last justify-self-start text-sm font-semibold text-accent hover:underline sm:hidden"
        >
          {moreOpen ? "Menos filtros" : moreFiltersLabel(hiddenPublicRpFiltersInUse(params, exporting))}
        </button>
        <ChoiceFilter {...input} name="status" label="Status da máquina" all="Todos" choices={rpStatusOptions} />
        {exporting ? null : <ChoiceFilter {...input} name="decision" label="Avaliação do supervisor" all="Todas" choices={decisionChoices} />}
        <ChoiceFilter {...input} name="lineId" label="Linha" all="Todas" choices={lineChoices(lines)} />
        <TextFilter {...input} name="tag" label="TAG" />
        <ChoiceFilter {...input} name="repeated" label="Falha repetida" all="Todas" choices={repeatedChoices} />
        <TextFilter {...input} name="from" label="De" type="date" />
        <TextFilter {...input} name="to" label="Até" type="date" />
      </div>
      {hasPublicRpFilters(params, exporting) ? (
        <div>
          <Button tone="ghost" onClick={onClear}>
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
