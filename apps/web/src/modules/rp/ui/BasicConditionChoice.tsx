import { useId } from "react";
import { RP_BASIC_CONDITION_ANSWERS, type RpBasicConditionAnswer } from "@manutencao/shared";
import { FieldError, RequiredMark } from "../../../design/ui/field-feedback";

type BasicConditionChoiceProps = {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  error?: string;
};

function isAnswer(value: string): value is RpBasicConditionAnswer {
  return (RP_BASIC_CONDITION_ANSWERS as readonly string[]).includes(value);
}

/**
 * "Impacto em condição básica?" com dois botões, Sim e Não (pedido do Léo, 2026-10-31). Tocar no escolhido limpa.
 * Não usa o Field: ele é um <label>, e o clique no rótulo apertaria o primeiro botão.
 * Texto antigo que não é Sim nem Não aparece embaixo até alguém escolher.
 * @example <BasicConditionChoice value={values.basicConditionImpact} onChange={(next) => set("basicConditionImpact", next)} />
 */
export function BasicConditionChoice({ value, onChange, required = false, error }: BasicConditionChoiceProps) {
  const labelId = useId();
  const legacy = value.trim() && !isAnswer(value) ? value.trim() : null;
  return (
    <div className="flex flex-col gap-1.5 text-sm text-app" data-invalid={error ? "" : undefined}>
      <span id={labelId} className="font-medium">
        Impacto em condição básica?
        {required ? <RequiredMark /> : null}
      </span>
      <div role="group" aria-labelledby={labelId} className="flex gap-2">
        {RP_BASIC_CONDITION_ANSWERS.map((answer) => (
          <button
            key={answer}
            type="button"
            aria-pressed={value === answer}
            onClick={() => onChange(value === answer ? "" : answer)}
            className={`min-h-11 min-w-24 rounded-control border px-4 py-2 text-sm font-semibold transition ${
              value === answer ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-app hover:bg-chip"
            }`}
          >
            {answer}
          </button>
        ))}
      </div>
      {legacy ? <span className="text-xs text-muted">Resposta antiga: “{legacy}”. Escolha Sim ou Não.</span> : null}
      {error ? <FieldError text={error} /> : null}
    </div>
  );
}
