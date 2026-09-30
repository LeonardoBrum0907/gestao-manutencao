import { useState } from "react";
import type { FactoryDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, TextInput } from "../../../design/ui/controls";
import { useDeleteFactory, useFactories, useSaveFactory } from "../data/cadastro";

export function FactoriesPage() {
  const factories = useFactories();
  const save = useSaveFactory();
  const remove = useDeleteFactory();
  const [editing, setEditing] = useState<FactoryDto | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  function edit(factory: FactoryDto) {
    setEditing(factory);
    setName(factory.name);
  }

  function reset() {
    setEditing(null);
    setName("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <PageTitle eyebrow="Apoio" title="Fábricas" text="Onde a máquina e a tarefa se penduram." />
        <div className="flex flex-col gap-3">
          {factories.data?.length === 0 ? <Card>Nenhuma fábrica ainda.</Card> : null}
          {factories.data?.map((factory) => (
            <Card key={factory.id} className="flex items-center justify-between gap-3">
              <button type="button" className="text-left font-medium" onClick={() => edit(factory)}>
                {factory.name}
              </button>
              {pendingDelete === factory.id ? (
                <Button
                  tone="danger"
                  onClick={() =>
                    remove.mutate(factory.id, {
                      onSuccess: () => {
                        setPendingDelete(null);
                        if (editing?.id === factory.id) reset();
                      },
                    })
                  }
                >
                  Confirmar exclusão
                </Button>
              ) : (
                <Button tone="ghost" onClick={() => setPendingDelete(factory.id)}>
                  Excluir
                </Button>
              )}
            </Card>
          ))}
          {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
        </div>
      </div>
      <Card>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate(
              { id: editing?.id, name },
              {
                onSuccess: reset,
              },
            );
          }}
        >
          <h2 className="text-lg font-semibold">{editing ? "Editar fábrica" : "Nova fábrica"}</h2>
          <Field label="Nome">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <Button type="submit" disabled={save.isPending}>
            Gravar
          </Button>
          {editing ? (
            <Button tone="ghost" onClick={reset}>
              Cancelar
            </Button>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
