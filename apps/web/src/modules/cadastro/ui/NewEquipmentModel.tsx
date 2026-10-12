import { useState } from "react";
import { errorMessage } from "../../../app/http";
import { Button, Notice, TextInput } from "../../../design/ui/controls";
import { useSaveEquipment } from "../../competencia/data/catalog";

/**
 * "+ Novo modelo" dentro do cadastro da máquina: cria o modelo de equipamento sem sair do modal e já o escolhe.
 * O modelo novo também entra na matriz de habilidades, porque é o mesmo equipamento.
 * @example <NewEquipmentModel onCreated={(id) => setDraft({ ...draft, equipmentId: id })} />
 */
export function NewEquipmentModel({ onCreated }: { onCreated: (id: string) => void }) {
  const save = useSaveEquipment();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="self-start text-sm font-semibold text-accent hover:underline" onClick={() => setOpen(true)}>
        + Novo modelo
      </button>
    );
  }

  function create() {
    save.mutate(
      { name, archived: false },
      {
        onSuccess: (equipment) => {
          onCreated(equipment.id);
          setName("");
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <TextInput
          autoFocus
          aria-label="Nome do novo modelo"
          value={name}
          placeholder="Ex.: Balança OCS"
          onChange={(event) => setName(event.target.value)}
          // Enter aqui cria o modelo; sem isso enviaria o formulário da máquina.
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            create();
          }}
        />
        <Button tone="ghost" disabled={save.isPending} onClick={create}>
          Criar
        </Button>
        <Button tone="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
      {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
    </div>
  );
}
