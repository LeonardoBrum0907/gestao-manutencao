import {
  DEFAULT_PERFORMANCE_TARGET,
  PERFORMANCE_SCORE_LABELS,
  PERFORMANCE_SCORES,
  type PerformanceCompetencyDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Field, Notice, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import {
  useDeleteCompetency,
  usePerformanceCompetencies,
  useReorderCompetencies,
  useSaveCompetency,
} from "../data/competencies";
import { useMatrixSettings, useSaveMatrixSettings } from "../../competencia/data/catalog";

function moved(ids: string[], index: number, step: -1 | 1): string[] {
  const next = [...ids];
  [next[index], next[index + step]] = [next[index + step], next[index]];
  return next;
}

function PerformanceTarget() {
  const settings = useMatrixSettings();
  const save = useSaveMatrixSettings();
  const current = settings.data?.performanceTarget ?? DEFAULT_PERFORMANCE_TARGET;
  return (
    <Card className="mb-4">
      <h3 className="text-sm font-semibold text-app">Meta das notas</h3>
      <p className="mt-1 text-sm text-muted">
        A nota que o gráfico "Média por competência", na aba Desempenho, marca como meta. Grava ao escolher.
      </p>
      <div className="mt-3 w-56">
        <Field label="Meta">
          <SelectInput
            value={current}
            disabled={settings.isPending || save.isPending}
            onChange={(event) => save.mutate({ performanceTarget: Number(event.target.value) })}
          >
            {PERFORMANCE_SCORES.map((value) => (
              <option key={value} value={value}>
                {value} {PERFORMANCE_SCORE_LABELS[value]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {settings.isError || save.isError ? (
        <div className="mt-3">
          <Notice>{errorMessage(settings.error ?? save.error)}</Notice>
        </div>
      ) : null}
    </Card>
  );
}

export function CompetenciesSection() {
  const competencies = usePerformanceCompetencies();
  const save = useSaveCompetency();
  const reorder = useReorderCompetencies();
  const remove = useDeleteCompetency();
  const toast = useToast();
  const list = competencies.data ?? [];
  const ids = list.map((item) => item.id);

  async function setArchived(competency: PerformanceCompetencyDto, archived: boolean) {
    try {
      await save.mutateAsync({ id: competency.id, name: competency.name, archived });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({
      text: archived ? `${competency.name} arquivada.` : `${competency.name} reativada.`,
      action: { label: "Desfazer", run: () => save.mutate({ id: competency.id, name: competency.name, archived: !archived }) },
    });
  }

  return (
    <div>
      <SectionTitle
        title="Competências do Desempenho"
        text="As competências da avaliação de desempenho, na aba Desempenho da ficha do técnico. A ordem daqui é a ordem da avaliação. Com nota lançada, arquive em vez de excluir: a nota antiga continua valendo."
      />
      <PerformanceTarget />
      {competencies.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {competencies.data ? (
        <InlineNameList
          items={list.map((competency) => ({ ...competency, muted: competency.archived, meta: competency.archived ? "Arquivada" : undefined }))}
          emptyText="Nenhuma competência ainda."
          addLabel="Adicionar competência"
          placeholder="Ex.: Trabalho em equipe"
          leading={(_competency, index) => <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>}
          onAdd={(name) => save.mutateAsync({ name, archived: false })}
          onRename={(competency, name) => save.mutateAsync({ id: competency.id, name, archived: competency.archived })}
          removalPath={(competency) => `/api/performance-competencies/${competency.id}`}
          onRemove={async (competency) => {
            await remove.mutateAsync(competency.id);
            toast({ text: `${competency.name} excluída.` });
          }}
          alternative={(competency, done) =>
            competency.archived
              ? undefined
              : { label: "Arquivar em vez disso", pending: save.isPending, onClick: () => void setArchived(competency, true).then(done) }
          }
          menuItems={(competency) => {
            const index = ids.indexOf(competency.id);
            return [
              { label: "Subir", disabled: index === 0 || reorder.isPending, onSelect: () => reorder.mutate(moved(ids, index, -1)) },
              { label: "Descer", disabled: index === ids.length - 1 || reorder.isPending, onSelect: () => reorder.mutate(moved(ids, index, 1)) },
              competency.archived
                ? { label: "Reativar", onSelect: () => void setArchived(competency, false) }
                : { label: "Arquivar", onSelect: () => void setArchived(competency, true) },
            ];
          }}
        />
      ) : null}
      {reorder.isError ? (
        <div className="mt-3">
          <Notice>{errorMessage(reorder.error)}</Notice>
        </div>
      ) : null}
      <p className="mt-6 text-sm text-muted">
        A matriz de habilidades por equipamento é outra coisa: fica na aba Matriz da ficha de cada técnico.
      </p>
    </div>
  );
}
