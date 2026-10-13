import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { SubassemblyDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteSubassembly, useSaveSubassembly, useSubassemblies } from "../data/cadastro";
import { ModelMachinesNote } from "./ModelMachinesNote";

// Subconjuntos por modelo de equipamento (o equipamento da matriz): valem para todas as máquinas do modelo.
// Os só de uma máquina, e os do modelo que ela não tem, ficam na tela daquela máquina.
// ?modelo=<id> abre a seção já no modelo e rola até ela (atalho da tela da máquina).
export function SubassembliesSection() {
  const requested = useSearchParams()[0].get("modelo") ?? "";
  const sectionRef = useRef<HTMLDivElement>(null);
  const catalog = useMatrixCatalog();
  const subassemblies = useSubassemblies();
  const save = useSaveSubassembly();
  const remove = useDeleteSubassembly();
  const toast = useToast();
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const [chosen, setChosen] = useState(requested);
  // Modelo pedido no link que não existe mais (ou foi arquivado) cai no primeiro da lista.
  const equipmentId = equipments.some((equipment) => equipment.id === chosen) ? chosen : equipments[0]?.id || "";
  const items = (subassemblies.data ?? []).filter((item) => item.equipmentId === equipmentId);
  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);

  // Rola de novo quando os cadastros chegam, porque as seções de cima crescem e empurram esta para baixo.
  const loaded = catalog.isSuccess && subassemblies.isSuccess;
  useEffect(() => {
    if (requested) sectionRef.current?.scrollIntoView({ block: "start" });
  }, [requested, loaded]);

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
    <div ref={sectionRef} className="scroll-mt-20">
      <SectionTitle
        title="Subconjuntos"
        text="Por modelo de equipamento, o mesmo equipamento da matriz de habilidades: valem para todas as máquinas do modelo. Os que só uma máquina tem, e os que ela não tem, se marcam na tela da máquina. Arquivado sai das listas, mas o histórico fica."
      />
      {catalog.isPending || subassemblies.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {catalog.data && equipments.length === 0 ? <Card>Nenhum modelo ativo. Cadastre o modelo em “Modelos de equipamento”, logo acima.</Card> : null}
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
          <ModelMachinesNote equipmentId={equipmentId} />
          <InlineNameList
            key={equipmentId}
            items={active}
            nameHeader="Subconjunto"
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
                nameHeader="Subconjunto"
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
