import { Field, SelectInput } from "../../../design/ui/controls";
import { InlineCreate } from "../../../design/ui/inline-create";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useEquipmentVersions, useSaveVersion } from "../data/machine-parts";
import { NewEquipmentModel } from "./NewEquipmentModel";

export type MachineModelValue = { equipmentId: string | null; versionId: string | null };

/**
 * Modelo de equipamento e versão da máquina, cada um com "+ Novo" para criar ali mesmo.
 * Trocar o modelo limpa a versão, porque a versão é de um modelo só.
 * @example <MachineModelFields value={{ equipmentId, versionId }} onChange={(next) => setDraft({ ...draft, ...next })} />
 */
export function MachineModelFields({ value, onChange }: { value: MachineModelValue; onChange: (value: MachineModelValue) => void }) {
  const catalog = useMatrixCatalog();
  const versions = useEquipmentVersions();
  const saveVersion = useSaveVersion();
  const models = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived || equipment.id === value.equipmentId);
  const modelVersions = (versions.data ?? []).filter(
    (version) => version.equipmentId === value.equipmentId && (!version.archived || version.id === value.versionId),
  );
  const setModel = (equipmentId: string | null) => onChange({ equipmentId, versionId: null });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Field label="Modelo de equipamento">
            <SelectInput value={value.equipmentId ?? ""} onChange={(event) => setModel(event.target.value || null)}>
              <option value="">Sem modelo</option>
              {models.map((equipment) => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <NewEquipmentModel onCreated={(equipmentId) => setModel(equipmentId)} />
        </div>
        {value.equipmentId ? (
          <div className="flex flex-col gap-2">
            <Field label="Versão">
              <SelectInput value={value.versionId ?? ""} onChange={(event) => onChange({ ...value, versionId: event.target.value || null })}>
                <option value="">Sem versão</option>
                {modelVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                    {version.archived ? " (arquivada)" : ""}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <InlineCreate
              label="+ Nova versão"
              inputLabel="Nome da nova versão"
              placeholder="Ex.: M092"
              pending={saveVersion.isPending}
              error={saveVersion.error}
              onCreate={async (name) => {
                const equipmentId = value.equipmentId ?? "";
                const version = await saveVersion.mutateAsync({ equipmentId, name, archived: false });
                onChange({ equipmentId, versionId: version.id });
              }}
            />
          </div>
        ) : null}
      </div>
      <p className="-mt-2 text-xs text-muted">
        O modelo dá os subconjuntos da máquina e é o mesmo equipamento da matriz de habilidades. A versão (ex.: M092, NMX) separa os
        subconjuntos que só existem nela, sem dividir a matriz. Se ainda não existem, crie aqui.
      </p>
    </>
  );
}
