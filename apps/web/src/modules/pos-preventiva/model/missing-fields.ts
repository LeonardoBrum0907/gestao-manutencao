import type { PostPreventiveFormValues } from "./post-preventive";

// Mesma ordem do formulário e da validação da API (readPostPreventive), com os nomes que a tela mostra.
const REQUIRED_FIELDS: readonly [string, (values: PostPreventiveFormValues) => boolean][] = [
  ["Data da preventiva", (values) => Boolean(values.preventiveDate)],
  ["Máquina", (values) => Boolean(values.machineId)],
  ["Subconjunto", (values) => Boolean(values.subassemblyId)],
  ["O que foi feito", (values) => Boolean(values.done.trim())],
  ["Ocorrência", (values) => Boolean(values.occurrence.trim())],
  ["Ação preventiva", (values) => Boolean(values.preventiveAction.trim())],
  ["Ponto de atenção", (values) => Boolean(values.attentionPoint.trim())],
  ["Técnicos", (values) => values.memberIds.length > 0],
];

function joinWithE(names: string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

/**
 * Aviso com todos os campos obrigatórios vazios de uma vez; a API só devolve o primeiro que falta.
 * A API continua decidindo o resto (ordem das datas, máquina válida).
 * @example missingFieldsNotice(vazio) // "Falta preencher: Máquina, Subconjunto, … e Técnicos."
 */
export function missingFieldsNotice(values: PostPreventiveFormValues): string | null {
  const missing = REQUIRED_FIELDS.filter(([, filled]) => !filled(values)).map(([name]) => name);
  if (!missing.length) return null;
  return `Falta preencher: ${joinWithE(missing)}.`;
}
