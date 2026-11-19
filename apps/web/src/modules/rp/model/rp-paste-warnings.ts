import { rpPasteWarningFields, type RpPasteWarningField } from "@manutencao/shared";
import type { RpFormValues } from "./rp";

type PasteFieldValues = Pick<RpFormValues, RpPasteWarningField>;

function filled(value: PasteFieldValues[RpPasteWarningField]): boolean {
  return Array.isArray(value) ? value.length > 0 : value.trim() !== "";
}

function changed(field: RpPasteWarningField, initial: PasteFieldValues, values: PasteFieldValues): boolean {
  return JSON.stringify(values[field]) !== JSON.stringify(initial[field]);
}

/**
 * Avisos do Colar que ainda valem: some o aviso cujo campo a pessoa mudou e deixou preenchido.
 * Antes o aviso ficava na tela mesmo depois de corrigido (Léo, 2026-11-19: "a tela não é atualizada").
 * @example openPasteWarnings(["Data não encontrada: confira a data."], inicial, { ...inicial, occurredAt: "2026-11-18" }) // []
 */
export function openPasteWarnings(warnings: readonly string[], initial: PasteFieldValues, values: PasteFieldValues): string[] {
  return warnings.filter((warning) => {
    const fields = rpPasteWarningFields(warning);
    return !fields.some((field) => changed(field, initial, values) && filled(values[field]));
  });
}
