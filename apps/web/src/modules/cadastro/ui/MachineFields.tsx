import { Link } from "react-router-dom";
import { Field, SelectInput } from "../../../design/ui/controls";
import { InlineCreate } from "../../../design/ui/inline-create";
import { useMachines, useSaveSubassembly, useSubassemblies } from "../data/cadastro";
import { subassemblyChoices, subassemblyPlaceholder } from "../model/machine-spot";

// Novo subconjunto direto da ficha, no modelo da máquina escolhida. Usa o InlineCreate, que trata o Enter: o campo
// próprio daqui enviava a ficha inteira no Enter (PR #143).
function NewSubassembly({ equipmentId, onCreated }: { equipmentId: string; onCreated: (id: string) => void }) {
  const save = useSaveSubassembly();
  return (
    <InlineCreate
      label="+ Novo subconjunto"
      inputLabel="Nome do novo subconjunto"
      placeholder="Nome do subconjunto"
      pending={save.isPending}
      error={save.error}
      onCreate={async (name) => onCreated((await save.mutateAsync({ equipmentId, name, archived: false })).id)}
    />
  );
}

export type MachineFieldsProps = {
  lineId: string;
  machineId: string;
  subassemblyId: string;
  // O que a ficha já tinha gravado: continua na lista mesmo arquivado.
  savedSubassemblyId: string;
  // Quem chama limpa o subconjunto ao trocar de máquina.
  onMachineChange: (machineId: string) => void;
  onSubassemblyChange: (subassemblyId: string) => void;
  // Problema e RP aceitam "não sei"; a pós-preventiva exige os dois.
  optional?: boolean;
};

/**
 * Máquina da linha escolhida e subconjunto do modelo dela, com os avisos de cadastro incompleto.
 * Ex.: `<MachineFields lineId={lineId} machineId={machineId} subassemblyId={subId} savedSubassemblyId="" onMachineChange={pick} onSubassemblyChange={setSubId} />`
 */
export function MachineFields({
  lineId,
  machineId,
  subassemblyId,
  savedSubassemblyId,
  onMachineChange,
  onSubassemblyChange,
  optional = false,
}: MachineFieldsProps) {
  const machines = useMachines();
  const subassemblies = useSubassemblies();
  const lineMachines = (machines.data ?? []).filter((machine) => machine.lineId === lineId);
  const machine = machines.data?.find((item) => item.id === machineId);
  const choices = subassemblyChoices(subassemblies.data ?? [], machine, savedSubassemblyId);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Máquina">
          <SelectInput value={machineId} disabled={!lineId} onChange={(event) => onMachineChange(event.target.value)}>
            <option value="">{lineId && !lineMachines.length ? "Nenhuma máquina nesta linha" : optional ? "Não sei" : "Escolha a máquina"}</option>
            {lineMachines.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.tag ? ` · ${item.tag}` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
        {machine?.equipmentId ? (
          <Field label="Subconjunto">
            <SelectInput value={subassemblyId} onChange={(event) => onSubassemblyChange(event.target.value)}>
              <option value="">{subassemblyPlaceholder(optional, choices.length)}</option>
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.archived ? " (arquivado)" : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}
      </div>
      {lineId && machines.isSuccess && !lineMachines.length ? (
        <p className="text-sm text-muted">
          Cadastre as máquinas da linha em{" "}
          <Link to="/configuracoes/fabricas" className="font-semibold text-accent hover:underline">
            Configurações
          </Link>
          .
        </p>
      ) : null}
      {machine && !machine.equipmentId ? (
        <p className="text-sm text-danger">
          Esta máquina ainda não tem modelo de equipamento, e os subconjuntos vêm do modelo. Escolha o modelo na{" "}
          <Link to={`/maquinas/${machine.id}`} className="font-semibold underline">
            tela da máquina
          </Link>
          .
        </p>
      ) : null}
      {machine?.equipmentId ? <NewSubassembly equipmentId={machine.equipmentId} onCreated={onSubassemblyChange} /> : null}
    </>
  );
}
