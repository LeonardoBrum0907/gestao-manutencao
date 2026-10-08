import { BEHAVIOR_TAG_GROUPS, type BehaviorTagDto, type BehaviorTagGroup } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useBehaviorTags, useDeleteBehaviorTag, useReorderBehaviorTags, useSaveBehaviorTag } from "../data/behavior-tags";

function moved(ids: string[], index: number, step: -1 | 1): string[] {
  const next = [...ids];
  [next[index], next[index + step]] = [next[index + step], next[index]];
  return next;
}

const PLACEHOLDERS: Record<BehaviorTagGroup, string> = {
  strengths: "Ex.: Ensina os colegas",
  attention: "Ex.: Atrasos frequentes",
  situation: "Ex.: Em treinamento",
};

function GroupList({ group, label, tags }: { group: BehaviorTagGroup; label: string; tags: BehaviorTagDto[] }) {
  const save = useSaveBehaviorTag();
  const reorder = useReorderBehaviorTags();
  const remove = useDeleteBehaviorTag();
  const toast = useToast();
  const ids = tags.map((tag) => tag.id);

  async function setArchived(tag: BehaviorTagDto, archived: boolean) {
    try {
      await save.mutateAsync({ ...tag, archived });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({
      text: archived ? `${tag.name} arquivada.` : `${tag.name} reativada.`,
      action: { label: "Desfazer", run: () => save.mutate({ ...tag, archived: !archived }) },
    });
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</h3>
      <InlineNameList
        items={tags.map((tag) => ({ ...tag, muted: tag.archived, meta: tag.archived ? "Arquivada" : undefined }))}
        emptyText="Nenhuma opção nesta categoria."
        addLabel="Adicionar opção"
        placeholder={PLACEHOLDERS[group]}
        onAdd={(name) => save.mutateAsync({ group, name, archived: false })}
        onRename={(tag, name) => save.mutateAsync({ ...tag, name })}
        removalPath={(tag) => `/api/behavior-tags/${tag.id}`}
        onRemove={async (tag) => {
          await remove.mutateAsync(tag.id);
          toast({ text: `${tag.name} excluída.` });
        }}
        alternative={(tag, done) =>
          tag.archived ? undefined : { label: "Arquivar em vez disso", pending: save.isPending, onClick: () => void setArchived(tag, true).then(done) }
        }
        menuItems={(tag) => {
          const index = ids.indexOf(tag.id);
          return [
            { label: "Subir", disabled: index === 0 || reorder.isPending, onSelect: () => reorder.mutate({ group, ids: moved(ids, index, -1) }) },
            {
              label: "Descer",
              disabled: index === ids.length - 1 || reorder.isPending,
              onSelect: () => reorder.mutate({ group, ids: moved(ids, index, 1) }),
            },
            tag.archived
              ? { label: "Reativar", onSelect: () => void setArchived(tag, false) }
              : { label: "Arquivar", onSelect: () => void setArchived(tag, true) },
          ];
        }}
      />
      {reorder.isError ? (
        <div className="mt-3">
          <Notice>{errorMessage(reorder.error)}</Notice>
        </div>
      ) : null}
    </div>
  );
}

export function BehaviorTagsSection() {
  const tags = useBehaviorTags();
  return (
    <div>
      <SectionTitle
        title="Opções do Comportamento"
        text="As etiquetas que se marcam na aba Comportamento da ficha do técnico, na mesma ordem daqui. Se a opção já está marcada em alguém, arquive em vez de excluir: ela sai das opções e continua em quem já tem."
      />
      {tags.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {tags.isError ? <Notice>{errorMessage(tags.error)}</Notice> : null}
      {tags.data ? (
        <div className="flex flex-col gap-6">
          {BEHAVIOR_TAG_GROUPS.map((group) => (
            <GroupList key={group.key} group={group.key} label={group.label} tags={tags.data.filter((tag) => tag.group === group.key)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
