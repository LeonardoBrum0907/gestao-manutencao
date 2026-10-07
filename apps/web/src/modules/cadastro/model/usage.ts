// Quantos colaboradores usam o item, para a lista mostrar ao lado do nome.
export function usageText(count: number | undefined): string {
  if (count === undefined) return "";
  if (count === 0) return "sem uso";
  return count === 1 ? "1 colaborador" : `${count} colaboradores`;
}
