import { Link } from "react-router-dom";
import type { EquipmentVersionDto, MachineDto, MatrixEquipmentDto, SubassemblyDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, SectionTitle } from "../../../design/ui/controls";
import { InlineCreate } from "../../../design/ui/inline-create";
import { useToast } from "../../../design/ui/toast";
import { useDeleteSubassembly, useSaveSubassembly } from "../../cadastro/data/cadastro";
import { useSetHiddenSubassemblies } from "../../cadastro/data/machine-parts";
import { machineSubassemblyGroups, toggledHidden } from "../model/machine-subassemblies";

type CardProps = {
  machine: MachineDto;
  model: MatrixEquipmentDto | undefined;
  version: EquipmentVersionDto | undefined;
  subassemblies: SubassemblyDto[];
  onEdit: () => void;
};

/**
 * Bloco "Subconjuntos" da tela da máquina: marca o que ela tem entre os do modelo e da versão,
 * e cria ou exclui os que são só dela. Sem modelo, abre o Editar para escolher.
 * @example <MachineSubassembliesCard machine={machine} model={model} version={version} subassemblies={list} onEdit={() => setEditing(true)} />
 */
export function MachineSubassembliesCard({ machine, model, version, subassemblies, onEdit }: CardProps) {
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
  return <SubassemblyChecklist machine={machine} model={model} version={version} subassemblies={subassemblies} />;
}

function SubassemblyChecklist({ machine, model, version, subassemblies }: Omit<CardProps, "onEdit"> & { model: MatrixEquipmentDto }) {
  const setHidden = useSetHiddenSubassemblies();
  const save = useSaveSubassembly();
  const groups = machineSubassemblyGroups(subassemblies, machine);
  const toggle = (item: SubassemblyDto, has: boolean) =>
    setHidden.mutate({ machineId: machine.id, ids: toggledHidden(machine.hiddenSubassemblyIds, item.id, has) });

  return (
    <Card>
      <SectionTitle
        title="Subconjuntos"
        action={
          <Link to={`/configuracoes/fabricas?modelo=${model.id}`} className="text-sm font-semibold text-accent hover:underline">
            Editar no modelo
          </Link>
        }
      />
      <p className="-mt-2 mb-3 text-sm text-muted">Desmarque o que esta máquina não tem. Só o que está marcado aparece nas fichas dela.</p>
      <div className="flex flex-col gap-4">
        <CheckGroup title={`Do modelo ${model.name}`} items={groups.model} machine={machine} onToggle={toggle} />
        {version ? <CheckGroup title={`Da versão ${version.name}`} items={groups.version} machine={machine} onToggle={toggle} /> : null}
        <OwnGroup items={groups.own} machine={machine} onToggle={toggle} />
        <InlineCreate
          label="+ Subconjunto só desta máquina"
          inputLabel="Nome do subconjunto só desta máquina"
          placeholder="Ex.: Balança"
          pending={save.isPending}
          error={save.error}
          onCreate={(name) => save.mutateAsync({ equipmentId: model.id, machineId: machine.id, name, archived: false })}
        />
        {setHidden.isError ? <Notice>{errorMessage(setHidden.error)}</Notice> : null}
      </div>
    </Card>
  );
}

type GroupProps = { items: SubassemblyDto[]; machine: MachineDto; onToggle: (item: SubassemblyDto, has: boolean) => void };

function CheckGroup({ title, items, machine, onToggle }: GroupProps & { title: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{title}</h3>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <SubassemblyCheck item={item} machine={machine} onToggle={onToggle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SubassemblyCheck({ item, machine, onToggle }: Omit<GroupProps, "items"> & { item: SubassemblyDto }) {
  const has = !machine.hiddenSubassemblyIds.includes(item.id);
  return (
    <label className="flex min-h-9 items-center gap-2.5 text-sm text-app">
      <input type="checkbox" className="h-[18px] w-[18px] accent-[var(--accent)]" checked={has} onChange={(event) => onToggle(item, event.target.checked)} />
      <span className={has ? "" : "text-muted line-through"}>{item.name}</span>
    </label>
  );
}

// Os só-desta-máquina se excluem aqui; com ficha pós-preventiva a API recusa e o aviso diz por quê.
function OwnGroup({ items, machine, onToggle }: GroupProps) {
  const remove = useDeleteSubassembly();
  const toast = useToast();
  if (!items.length) return null;
  const removeItem = (item: SubassemblyDto) =>
    remove.mutate(item.id, {
      onSuccess: () => toast({ text: `${item.name} excluído.` }),
      onError: (error) => toast({ text: errorMessage(error) }),
    });
  return (
    <section>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">Só desta máquina</h3>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <SubassemblyCheck item={item} machine={machine} onToggle={onToggle} />
            <button
              type="button"
              aria-label={`Excluir ${item.name}`}
              disabled={remove.isPending}
              className="rounded-control px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger-soft"
              onClick={() => removeItem(item)}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
