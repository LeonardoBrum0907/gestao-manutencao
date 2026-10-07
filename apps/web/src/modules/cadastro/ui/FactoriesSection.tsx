import { useState } from "react";
import type { FactoryDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, SectionTitle, TextInput } from "../../../design/ui/controls";
import { useDeleteFactory, useFactories, useSaveFactory } from "../data/cadastro";

export function FactoriesSection() {
  const factories = useFactories();
  const save = useSaveFactory();
  const remove = useDeleteFactory();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FactoryDto | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setEditing(null);
    setName("");
  }

  function create() {
    setEditing(null);
    setName("");
    setOpen(true);
  }

  function edit(factory: FactoryDto) {
    setEditing(factory);
    setName(factory.name);
    setOpen(true);
  }

  return (
    <div>
      <SectionTitle
        title="Fábricas"
        text="Onde a linha e a tarefa se penduram."
        action={<Button onClick={create}>Nova fábrica</Button>}
      />
      {factories.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {factories.data?.length === 0 ? <Card>Nenhuma fábrica ainda.</Card> : null}
        {factories.data?.map((factory) => (
          <Card key={factory.id} compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-left font-medium text-app transition hover:text-accent hover:underline"
              onClick={() => edit(factory)}
            >
              {factory.name}
            </button>
            <div className="flex justify-end gap-2">
              {pendingDelete === factory.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(factory.id, {
                        onSuccess: () => {
                          setPendingDelete(null);
                          if (editing?.id === factory.id) close();
                        },
                      })
                    }
                  >
                    Confirmar
                  </Button>
                  <Button tone="ghost" onClick={() => setPendingDelete(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button tone="ghost" onClick={() => setPendingDelete(factory.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
        {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
      </div>
      <Modal open={open} title={editing ? "Editar fábrica" : "Nova fábrica"} onClose={close}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing?.id, name }, { onSuccess: close });
          }}
        >
          <Field label="Nome">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              Gravar
            </Button>
            <Button tone="ghost" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
