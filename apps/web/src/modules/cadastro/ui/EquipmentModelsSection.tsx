import type { MatrixEquipmentDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteEquipment, useMatrixCatalog, useReorderEquipments, useSaveEquipment } from "../../competencia/data/catalog";
import { useMachines, useSubassemblies } from "../data/cadastro";

function count(value: number, one: string, many: string): string | null {
  if (!value) return null;
  return value === 1 ? `1 ${one}` : `${value} ${many}`;
}

// Modelos de equipamento: o tipo de cada máquina. É o mesmo equipamento da matriz de habilidades,
// então criar, renomear ou arquivar aqui vale também na aba Avaliação.
export function EquipmentModelsSection() {
  const catalog = useMatrixCatalog();
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const save = useSaveEquipment();
  const remove = useDeleteEquipment();
  const reorder = useReorderEquipments();
  const toast = useToast();
  const equipments = catalog.data?.equipments ?? [];
  const active = equipments.filter((equipment) => !equipment.archived);
  const archived = equipments.filter((equipment) => equipment.archived);
  const activeIds = active.map((equipment) => equipment.id);

  const meta = (equipment: MatrixEquipmentDto) =>
    [
      count(machines.data?.filter((machine) => machine.equipmentId === equipment.id).length ?? 0, "máquina", "máquinas"),
      count(subassemblies.data?.filter((item) => item.equipmentId === equipment.id && !item.archived).length ?? 0, "subconjunto", "subconjuntos"),
    ]
      .filter(Boolean)
      .join(" · ") || "sem uso";

  async function setArchived(equipment: MatrixEquipmentDto, value: boolean) {
    try {
      await save.mutateAsync({ id: equipment.id, name: equipment.name, archived: value });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({
      text: value ? `${equipment.name} arquivado.` : `${equipment.name} reativado.`,
      action: { label: "Desfazer", run: () => save.mutate({ id: equipment.id, name: equipment.name, archived: !value }) },
    });
  }

  // A ordem é a mesma da matriz do técnico. Os arquivados vão para o fim.
  function move(equipment: MatrixEquipmentDto, step: -1 | 1) {
    const index = activeIds.indexOf(equipment.id);
    const next = [...activeIds];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    reorder.mutate([...next, ...archived.map((item) => item.id)], { onError: (error) => toast({ text: errorMessage(error) }) });
  }

  const shared = {
    onRename: (equipment: MatrixEquipmentDto, name: string) => save.mutateAsync({ id: equipment.id, name, archived: equipment.archived }),
    removalPath: (equipment: MatrixEquipmentDto) => `/api/matrix-catalog/equipments/${equipment.id}`,
    onRemove: async (equipment: MatrixEquipmentDto) => {
      await remove.mutateAsync(equipment.id);
      toast({ text: `${equipment.name} excluído.` });
    },
  };

  return (
    <div>
      <SectionTitle
        title="Modelos de equipamento"
        text="O tipo de cada máquina (ex.: Encartuchadeira CAM). Os subconjuntos ficam no modelo, e o modelo é o mesmo equipamento da matriz de habilidades. Arquivado sai das listas, mas o histórico fica."
      />
      {catalog.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {catalog.isError ? <Notice>{errorMessage(catalog.error)}</Notice> : null}
      {catalog.data ? (
        <div className="flex flex-col gap-4">
          <InlineNameList<MatrixEquipmentDto & { meta: string }>
            items={active.map((equipment) => ({ ...equipment, meta: meta(equipment) }))}
            emptyText="Nenhum modelo ativo."
            addLabel="Adicionar modelo"
            placeholder="Ex.: Encartuchadeira CAM"
            onAdd={(name) => save.mutateAsync({ name, archived: false })}
            alternative={(equipment, done) => ({
              label: "Arquivar em vez disso",
              pending: save.isPending,
              onClick: () => void setArchived(equipment, true).then(done),
            })}
            menuItems={(equipment) => {
              const index = activeIds.indexOf(equipment.id);
              return [
                { label: "Subir", disabled: reorder.isPending || index === 0, onSelect: () => move(equipment, -1) },
                { label: "Descer", disabled: reorder.isPending || index === activeIds.length - 1, onSelect: () => move(equipment, 1) },
                { label: "Arquivar", onSelect: () => void setArchived(equipment, true) },
              ];
            }}
            {...shared}
          />
          {archived.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Arquivados</h3>
              <InlineNameList<MatrixEquipmentDto & { meta: string; muted: boolean }>
                items={archived.map((equipment) => ({ ...equipment, meta: meta(equipment), muted: true }))}
                emptyText=""
                menuItems={(equipment) => [{ label: "Reativar", onSelect: () => void setArchived(equipment, false) }]}
                {...shared}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
