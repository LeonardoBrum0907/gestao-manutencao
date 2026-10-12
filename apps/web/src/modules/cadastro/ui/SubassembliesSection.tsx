import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { EquipmentVersionDto } from "@manutencao/shared";
import { Card, Field, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useSubassemblies } from "../data/cadastro";
import { useEquipmentVersions } from "../data/machine-parts";
import { ModelMachinesNote } from "./ModelMachinesNote";
import { ScopedSubassemblyList } from "./ScopedSubassemblyList";
import { VersionsList } from "./VersionsList";

// Subconjuntos por modelo de equipamento (o equipamento da matriz), com as versões dele (M092, NMX).
// Os só de uma máquina ficam na tela daquela máquina.
// ?modelo=<id> abre a seção já no modelo e rola até ela (atalho da tela da máquina).
export function SubassembliesSection() {
  const requested = useSearchParams()[0].get("modelo") ?? "";
  const sectionRef = useRef<HTMLDivElement>(null);
  const catalog = useMatrixCatalog();
  const subassemblies = useSubassemblies();
  const versions = useEquipmentVersions();
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const [chosen, setChosen] = useState(requested);
  // Modelo pedido no link que não existe mais (ou foi arquivado) cai no primeiro da lista.
  const equipmentId = equipments.some((equipment) => equipment.id === chosen) ? chosen : equipments[0]?.id || "";

  // Rola de novo quando os cadastros chegam, porque as seções de cima crescem e empurram esta para baixo.
  const loaded = catalog.isSuccess && subassemblies.isSuccess;
  useEffect(() => {
    if (requested) sectionRef.current?.scrollIntoView({ block: "start" });
  }, [requested, loaded]);

  return (
    <div ref={sectionRef} className="scroll-mt-20">
      <SectionTitle
        title="Subconjuntos"
        text="Por modelo de equipamento, o mesmo equipamento da matriz de habilidades. Valem para todas as máquinas do modelo ou só para as de uma versão. Os que só uma máquina tem, e os que ela não tem, se marcam na tela da máquina."
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
          <ModelParts key={equipmentId} equipmentId={equipmentId} versions={(versions.data ?? []).filter((version) => version.equipmentId === equipmentId)} />
        </div>
      ) : null}
    </div>
  );
}

// Versões do modelo e, abaixo, os subconjuntos do lugar escolhido em "Valem para" (o modelo todo ou uma versão).
function ModelParts({ equipmentId, versions }: { equipmentId: string; versions: EquipmentVersionDto[] }) {
  const subassemblies = useSubassemblies();
  const [scope, setScope] = useState("");
  const active = versions.filter((version) => !version.archived);
  // Versão arquivada (ou excluída) some do seletor; aí a lista volta para o modelo todo.
  const versionId = active.some((version) => version.id === scope) ? scope : null;
  const items = (subassemblies.data ?? []).filter((item) => item.equipmentId === equipmentId && !item.machineId && item.versionId === versionId);
  const versionName = active.find((version) => version.id === versionId)?.name;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Versões</h3>
        <VersionsList equipmentId={equipmentId} versions={versions} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Subconjuntos</h3>
        {active.length > 0 ? (
          <div className="sm:max-w-sm">
            <Field label="Valem para">
              <SelectInput value={versionId ?? ""} onChange={(event) => setScope(event.target.value)}>
                <option value="">Todas as máquinas do modelo</option>
                {active.map((version) => (
                  <option key={version.id} value={version.id}>
                    Só a versão {version.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        ) : null}
        <ScopedSubassemblyList
          equipmentId={equipmentId}
          versionId={versionId}
          items={items}
          emptyText={versionName ? `Nenhum subconjunto só da versão ${versionName}.` : "Nenhum subconjunto ativo neste modelo."}
        />
      </div>
    </>
  );
}
