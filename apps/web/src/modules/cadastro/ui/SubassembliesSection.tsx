import { useState } from "react";
import type { SubassemblyDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, SectionTitle, SelectInput, TextInput } from "../../../design/ui/controls";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteSubassembly, useSaveSubassembly, useSubassemblies } from "../data/cadastro";

const small = "px-3 py-1.5";

// Subconjuntos por modelo de equipamento (o equipamento da matriz): valem para todas as máquinas do modelo.
export function SubassembliesSection() {
  const catalog = useMatrixCatalog();
  const subassemblies = useSubassemblies();
  const save = useSaveSubassembly();
  const remove = useDeleteSubassembly();
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const [chosen, setChosen] = useState("");
  const equipmentId = chosen || equipments[0]?.id || "";
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<SubassemblyDto | null>(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const items = (subassemblies.data ?? []).filter((item) => item.equipmentId === equipmentId);
  const active = items.filter((item) => !item.archived);
  const archived = items.filter((item) => item.archived);

  function add() {
    if (!equipmentId) return;
    save.mutate({ equipmentId, name, archived: false }, { onSuccess: () => setName("") });
  }

  function row(item: SubassemblyDto) {
    return (
      <li key={item.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className={`min-w-0 text-left transition hover:text-accent hover:underline ${item.archived ? "text-muted" : "text-app"}`}
          onClick={() => {
            setEditing(item);
            setEditName(item.name);
          }}
        >
          {item.name}
        </button>
        <div className="flex shrink-0 justify-end gap-2">
          {pendingDelete === item.id ? (
            <>
              <Button
                tone="danger"
                className={small}
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.id, { onSuccess: () => setPendingDelete(null) })}
              >
                Confirmar
              </Button>
              <Button tone="ghost" className={small} onClick={() => setPendingDelete(null)}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                tone="ghost"
                className={small}
                disabled={save.isPending}
                onClick={() => save.mutate({ id: item.id, equipmentId: item.equipmentId, name: item.name, archived: !item.archived })}
              >
                {item.archived ? "Reativar" : "Arquivar"}
              </Button>
              <Button tone="ghost" className={small} onClick={() => setPendingDelete(item.id)}>
                Excluir
              </Button>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <div>
      <SectionTitle
        title="Subconjuntos"
        text="Por modelo de equipamento, o mesmo equipamento da matriz de habilidades. Valem para todas as máquinas do modelo. Arquivado sai das listas, mas o histórico fica."
      />
      {catalog.isPending || subassemblies.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {catalog.data && equipments.length === 0 ? <Card>Nenhum modelo ativo. Cadastre o equipamento na aba Avaliação.</Card> : null}
      {equipments.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Modelo de equipamento">
              <SelectInput value={equipmentId} onChange={(event) => setChosen(event.target.value)}>
                {equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                add();
              }}
            >
              <div className="min-w-0 flex-1">
                <Field label="Novo subconjunto">
                  <TextInput value={name} placeholder="Válvulas roletes" onChange={(event) => setName(event.target.value)} />
                </Field>
              </div>
              <Button type="submit" disabled={save.isPending || !name.trim()}>
                Adicionar
              </Button>
            </form>
          </div>
          {save.isError && !editing ? <Notice>{errorMessage(save.error)}</Notice> : null}
          {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
          {active.length === 0 ? <p className="text-sm text-muted">Nenhum subconjunto ativo neste modelo.</p> : null}
          <ul className="divide-y divide-line">{active.map(row)}</ul>
          {archived.length > 0 ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Arquivados</h3>
              <ul className="divide-y divide-line">{archived.map(row)}</ul>
            </div>
          ) : null}
        </Card>
      ) : null}
      <Modal open={editing !== null} title="Renomear subconjunto" onClose={() => setEditing(null)}>
        {editing ? (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate(
                { id: editing.id, equipmentId: editing.equipmentId, name: editName, archived: editing.archived },
                { onSuccess: () => setEditing(null) },
              );
            }}
          >
            <Field label="Nome">
              <TextInput value={editName} onChange={(event) => setEditName(event.target.value)} />
            </Field>
            {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={save.isPending}>
                Gravar
              </Button>
              <Button tone="ghost" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
