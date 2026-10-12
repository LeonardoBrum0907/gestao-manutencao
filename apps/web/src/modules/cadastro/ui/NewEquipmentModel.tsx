import { InlineCreate } from "../../../design/ui/inline-create";
import { useSaveEquipment } from "../../competencia/data/catalog";

/**
 * "+ Novo modelo" dentro do cadastro da máquina: cria o modelo de equipamento sem sair do modal e já o escolhe.
 * O modelo novo também entra na matriz de habilidades, porque é o mesmo equipamento.
 * @example <NewEquipmentModel onCreated={(id) => setDraft({ ...draft, equipmentId: id })} />
 */
export function NewEquipmentModel({ onCreated }: { onCreated: (id: string) => void }) {
  const save = useSaveEquipment();
  return (
    <InlineCreate
      label="+ Novo modelo"
      inputLabel="Nome do novo modelo"
      placeholder="Ex.: Blistadeira M91"
      pending={save.isPending}
      error={save.error}
      onCreate={async (name) => onCreated((await save.mutateAsync({ name, archived: false })).id)}
    />
  );
}
