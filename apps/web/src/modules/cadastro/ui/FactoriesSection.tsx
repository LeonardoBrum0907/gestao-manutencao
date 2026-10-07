import { SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteFactory, useFactories, useLines, useSaveFactory } from "../data/cadastro";

export function FactoriesSection() {
  const factories = useFactories();
  const lines = useLines();
  const save = useSaveFactory();
  const remove = useDeleteFactory();
  const toast = useToast();
  const lineCount = new Map<string, number>();
  for (const line of lines.data ?? []) lineCount.set(line.factoryId, (lineCount.get(line.factoryId) ?? 0) + 1);

  return (
    <div>
      <SectionTitle title="Fábricas" text="Onde a linha e a tarefa se penduram. Clique no nome para renomear." />
      {factories.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {factories.data ? (
        <InlineNameList
          items={factories.data.map((factory) => {
            const count = lineCount.get(factory.id) ?? 0;
            return { ...factory, meta: count ? `${count} ${count === 1 ? "linha" : "linhas"}` : "sem linhas" };
          })}
          emptyText="Nenhuma fábrica ainda."
          addLabel="Adicionar fábrica"
          placeholder="Ex.: Fábrica 3"
          onAdd={(name) => save.mutateAsync({ name })}
          onRename={(factory, name) => save.mutateAsync({ id: factory.id, name })}
          removalPath={(factory) => `/api/factories/${factory.id}`}
          onRemove={async (factory) => {
            await remove.mutateAsync(factory.id);
            toast({ text: `${factory.name} excluída.` });
          }}
        />
      ) : null}
    </div>
  );
}
