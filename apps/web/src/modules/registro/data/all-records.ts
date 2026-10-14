import { useQuery } from "@tanstack/react-query";
import type { RecordListItemDto, RecordPageDto } from "@manutencao/shared";
import { api } from "../../../app/http";

const PAGE_SIZE = 100;
// Trava de segurança: são centenas de registros hoje. Passando disso, a busca precisa ir para a API.
const MAX_RECORDS = 3000;

/**
 * Todos os registros (tarefa, problema, feedback) de uma vez, para a tela Registros procurar, filtrar e
 * ordenar no navegador. Lê a lista paginada até o fim.
 * @example const records = useAllRecords(); records.data?.length
 */
export function useAllRecords() {
  return useQuery({
    queryKey: ["records", "all"],
    queryFn: async () => {
      const items: RecordListItemDto[] = [];
      let cursor: string | null = null;
      do {
        const query = new URLSearchParams({ type: "task,problem,feedback", limit: String(PAGE_SIZE) });
        if (cursor) query.set("cursor", cursor);
        const page: RecordPageDto = await api<RecordPageDto>(`/api/records?${query}`);
        items.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor && items.length < MAX_RECORDS);
      return items;
    },
  });
}
