import type { EquipmentVersionDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useMachines } from "../data/cadastro";
import { useDeleteVersion, useSaveVersion } from "../data/machine-parts";

/**
 * Versões de um modelo (M092, NMX): adicionar, renomear, arquivar, reativar e excluir as sem uso.
 * @example <VersionsList equipmentId="blis" versions={doModelo} />
 */
export function VersionsList({ equipmentId, versions }: { equipmentId: string; versions: EquipmentVersionDto[] }) {
  const machines = useMachines();
  const save = useSaveVersion();
  const remove = useDeleteVersion();
  const toast = useToast();
  const meta = (version: EquipmentVersionDto) => {
    const count = machines.data?.filter((machine) => machine.versionId === version.id).length ?? 0;
    return count === 1 ? "1 máquina" : count ? `${count} máquinas` : "nenhuma máquina";
  };

  async function setArchived(version: EquipmentVersionDto, value: boolean) {
    try {
      await save.mutateAsync({ ...version, archived: value });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({ text: value ? `Versão ${version.name} arquivada.` : `Versão ${version.name} reativada.` });
  }

  return (
    <InlineNameList<EquipmentVersionDto & { meta: string; muted: boolean }>
      key={equipmentId}
      items={versions.map((version) => ({ ...version, meta: meta(version), muted: version.archived }))}
      nameHeader="Versão"
      metaHeader="Em uso"
      emptyText="Nenhuma versão. Sem versão, os subconjuntos do modelo valem para todas as máquinas dele."
      addLabel="Adicionar versão"
      placeholder="Ex.: M092"
      onAdd={(name) => save.mutateAsync({ equipmentId, name, archived: false })}
      onRename={(version, name) => save.mutateAsync({ ...version, name })}
      removalPath={(version) => `/api/equipment-versions/${version.id}`}
      onRemove={async (version) => {
        await remove.mutateAsync(version.id);
        toast({ text: `Versão ${version.name} excluída.` });
      }}
      alternative={(version, done) => ({
        label: "Arquivar em vez disso",
        pending: save.isPending,
        onClick: () => void setArchived(version, true).then(done),
      })}
      menuItems={(version) => [
        version.archived
          ? { label: "Reativar", onSelect: () => void setArchived(version, false) }
          : { label: "Arquivar", onSelect: () => void setArchived(version, true) },
      ]}
    />
  );
}
