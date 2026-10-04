import type { QueryClient, QueryKey } from "@tanstack/react-query";

// O que o servidor devolve ao salvar já é o item novo: grava no cache em vez de buscar a lista inteira de novo.
// A lista fica marcada como velha (sem buscar agora), então a próxima visita confere com o servidor.

function byName<T extends { name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function upsertByName<T extends { id: string; name: string }>(client: QueryClient, key: QueryKey, item: T): void {
  client.setQueryData<T[]>(key, (list) => {
    if (!list) return list;
    return byName(list.some((current) => current.id === item.id) ? list.map((current) => (current.id === item.id ? item : current)) : [...list, item]);
  });
  void client.invalidateQueries({ queryKey: key, refetchType: "none" });
}

export function removeById<T extends { id: string }>(client: QueryClient, key: QueryKey, id: string): void {
  client.setQueryData<T[]>(key, (list) => list?.filter((current) => current.id !== id));
  void client.invalidateQueries({ queryKey: key, refetchType: "none" });
}

// Cadastros que quase nunca mudam: não precisam ser buscados de novo a cada tela.
export const REFERENCE_DATA = { staleTime: 10 * 60_000 } as const;
