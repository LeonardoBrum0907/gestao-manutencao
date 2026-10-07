import { useState } from "react";
import type { SubassemblyDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteSubassembly, useSaveSubassembly, useSubassemblies } from "../data/cadastro";

// Subconjuntos por modelo de equipamento (o equipamento da matriz): valem para todas as máquinas do modelo.
export function SubassembliesSection() {
  const catalog = useMatrixCatalog();
  const subassemblies = useSubassemblies();
  const save = useSaveSubassembly();
  const remove = useDeleteSubassembly();
  const toast = useToast();
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const [chosen, setChosen] = useState("");
  const equipmentId = chosen || equipments[0]?.id || "";
  const items = (subassemblies.data ?? []).filter((item) => item.equipmentId === equipmentId);
  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);

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
    <div>
      <SectionTitle
        title="Subconjuntos"
        text="Por modelo de equipamento, o mesmo equipamento da matriz de habilidades. Valem para todas as máquinas do modelo. Arquivado sai das listas, mas o histórico fica."
      />
      {catalog.isPending || subassemblies.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {catalog.data && equipments.length === 0 ? <Card>Nenhum modelo ativo. Cadastre o equipamento na aba Avaliação.</Card> : null}
      {equipments.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="sm:max-w-sm">
            <Field label="Modelo de equipamento">
              <SelectInput value={equipmentId} onChange={(event) => setChosen(event.target.value)}>
                {equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <InlineNameList
            key={equipmentId}
            items={active}
            emptyText="Nenhum subconjunto ativo neste modelo."
            addLabel="Adicionar subconjunto"
            placeholder="Ex.: Válvulas roletes"
            onAdd={(name) => save.mutateAsync({ equipmentId, name, archived: false })}
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
                key={`${equipmentId}-archived`}
                items={archived.map((item) => ({ ...item, muted: true }))}
                emptyText=""
                menuItems={(item) => [{ label: "Reativar", onSelect: () => void setArchived(item, false) }]}
                {...shared}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
