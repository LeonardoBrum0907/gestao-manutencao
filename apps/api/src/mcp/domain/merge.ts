// Edição pela IA manda só o que muda; o caso de uso quer a ficha inteira. Campo ausente fica como
// está, null limpa.
export function overlay<T extends Record<string, unknown>>(current: T, changes: Record<string, unknown>): T {
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined) next[key] = value;
  }
  return next as T;
}

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function matches(search: string | undefined, ...values: (string | null | undefined)[]): boolean {
  if (!search) return true;
  const wanted = normalize(search);
  return values.some((value) => value && normalize(value).includes(wanted));
}
