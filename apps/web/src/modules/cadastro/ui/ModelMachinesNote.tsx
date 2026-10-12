import { Link } from "react-router-dom";
import { useLines, useMachines } from "../data/cadastro";
import { machinesOfModel } from "../model/model-machines";

/**
 * Onde os subconjuntos do modelo aparecem: as máquinas que usam o modelo, com link para cada uma.
 * Sem máquina, explica como ligar, porque o subconjunto só chega à máquina pelo modelo dela.
 * @example <ModelMachinesNote equipmentId={equipmentId} />
 */
export function ModelMachinesNote({ equipmentId }: { equipmentId: string }) {
  const machines = useMachines();
  const lines = useLines();
  if (!machines.data || !lines.data) return null;
  const items = machinesOfModel(machines.data, lines.data, equipmentId);

  if (!items.length) {
    return (
      <p className="rounded-control border border-line bg-chip px-3 py-2 text-sm text-app">
        Nenhuma máquina usa este modelo, então estes subconjuntos ainda não aparecem em máquina nenhuma. Para ligar, abra a
        linha em “Linhas”, logo acima, e use “+ Máquina” escolhendo este modelo, ou abra uma máquina que já existe e troque o
        modelo dela em Editar.
      </p>
    );
  }

  return (
    <div className="text-sm">
      <p className="text-muted">
        Aparecem {items.length === 1 ? "na máquina" : `nestas ${items.length} máquinas`} (o modelo de cada máquina se escolhe em
        Editar, na tela dela):
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/maquinas/${item.id}`} className="inline-block rounded-control border border-line px-2 py-0.5 text-app transition hover:border-accent hover:text-accent">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
