import type { SubassemblyDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteSubassembly, useSaveSubassembly } from "../data/cadastro";

type ScopedSubassemblyListProps = {
  equipmentId: string;
  // Sem versão: os que valem para todas as máquinas do modelo.
  versionId: string | null;
  items: SubassemblyDto[];
  emptyText: string;
};

/**
 * Subconjuntos de um modelo (ou de uma versão dele): adicionar, renomear, arquivar, reativar e excluir.
 * O que se adiciona aqui vale para o mesmo lugar da lista (o modelo todo ou a versão).
 * @example <ScopedSubassemblyList equipmentId="blis" versionId={null} items={doModelo} emptyText="Nenhum subconjunto." />
 */
export function ScopedSubassemblyList({ equipmentId, versionId, items, emptyText }: ScopedSubassemblyListProps) {
  const save = useSaveSubassembly();
  const remove = useDeleteSubassembly();
  const toast = useToast();
  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);
  const listKey = `${equipmentId}-${versionId ?? "modelo"}`;

  async function setArchived(item: SubassemblyDto, value: boolean) {
    try {
      await save.mutateAsync({ id: item.id, equipmentId: item.equipmentId, name: item.name, archived: value });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({
      text: value ? `${item.name} arquivado.` : `${item.name} reativado.`,
      action: { label: "Desfazer", run: () => save.mutate({ id: item.id, equipmentId: item.equipmentId, name: item.name, archived: !value }) },
    });
  }

  const shared = {
    onRename: (item: SubassemblyDto, name: string) => save.mutateAsync({ id: item.id, equipmentId: item.equipmentId, name, archived: item.archived }),
    removalPath: (item: SubassemblyDto) => `/api/subassemblies/${item.id}`,
    onRemove: async (item: SubassemblyDto) => {
      await remove.mutateAsync(item.id);
      toast({ text: `${item.name} excluído.` });
    },
  };

  return (
    <>
      <InlineNameList
        key={listKey}
        items={active}
        nameHeader="Subconjunto"
        emptyText={emptyText}
        addLabel="Adicionar subconjunto"
        placeholder="Ex.: Válvulas roletes"
        onAdd={(name) => save.mutateAsync({ equipmentId, versionId, name, archived: false })}
        alternative={(item, done) => ({
          label: "Arquivar em vez disso",
          pending: save.isPending,
          onClick: () => void setArchived(item, true).then(done),
        })}
        menuItems={(item) => [{ label: "Arquivar", onSelect: () => void setArchived(item, true) }]}
        {...shared}
      />
      {archived.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Arquivados</h3>
          <InlineNameList
            key={`${listKey}-archived`}
            items={archived.map((item) => ({ ...item, muted: true }))}
            nameHeader="Subconjunto"
            emptyText=""
            menuItems={(item) => [{ label: "Reativar", onSelect: () => void setArchived(item, false) }]}
            {...shared}
          />
        </div>
      ) : null}
    </>
  );
}
