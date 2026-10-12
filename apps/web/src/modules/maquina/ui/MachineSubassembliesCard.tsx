import { Link } from "react-router-dom";
import type { MachineDto, MatrixEquipmentDto, SubassemblyDto } from "@manutencao/shared";
import { Button, Card, SectionTitle } from "../../../design/ui/controls";
import { subassemblyChoices } from "../../cadastro/model/machine-spot";

/**
 * Bloco "Subconjuntos" da tela da máquina: os subconjuntos ativos que ela recebe do modelo e o atalho para editá-los.
 * Sem modelo, diz que é o modelo que liga os subconjuntos e abre o Editar.
 * @example <MachineSubassembliesCard machine={machine} model={model} subassemblies={list} onEdit={() => setEditing(true)} />
 */
export function MachineSubassembliesCard({
  machine,
  model,
  subassemblies,
  onEdit,
}: {
  machine: MachineDto;
  model: MatrixEquipmentDto | undefined;
  subassemblies: SubassemblyDto[];
  onEdit: () => void;
}) {
  if (!model) {
    return (
      <Card>
        <SectionTitle title="Subconjuntos" text="Os subconjuntos vêm do modelo de equipamento, e esta máquina ainda não tem modelo." />
        <Button tone="ghost" onClick={onEdit}>
          Escolher o modelo
        </Button>
      </Card>
    );
  }

  const items = subassemblyChoices(subassemblies, machine.equipmentId, "");
  return (
    <Card>
      <SectionTitle
        title="Subconjuntos"
        action={
          <Link to={`/configuracoes/fabricas?modelo=${model.id}`} className="text-sm font-semibold text-accent hover:underline">
            Editar
          </Link>
        }
      />
      <p className="-mt-2 mb-3 text-sm text-muted">Vêm do modelo {model.name} e valem para todas as máquinas dele.</p>
      {items.length ? (
        <ul className="flex flex-wrap gap-1.5 text-sm">
          {items.map((item) => (
            <li key={item.id} className="rounded-control border border-line px-2 py-0.5 text-app">
              {item.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nenhum subconjunto neste modelo ainda.</p>
      )}
    </Card>
  );
}
