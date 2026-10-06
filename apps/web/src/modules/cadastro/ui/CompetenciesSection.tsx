import { useState } from "react";
import {
  DEFAULT_PERFORMANCE_TARGET,
  PERFORMANCE_SCORE_LABELS,
  PERFORMANCE_SCORES,
  type PerformanceCompetencyDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, SectionTitle, SelectInput, TextInput } from "../../../design/ui/controls";
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

const small = "px-3 py-1.5";

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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PerformanceCompetencyDto | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const list = competencies.data ?? [];
  const ids = list.map((item) => item.id);

  function close() {
    setOpen(false);
    setEditing(null);
    setName("");
    save.reset();
  }

  function edit(competency: PerformanceCompetencyDto | null) {
    setEditing(competency);
    setName(competency?.name ?? "");
    setOpen(true);
  }

  const error = save.isError && !open ? save.error : (remove.error ?? reorder.error);

  return (
    <div>
      <SectionTitle
        title="Competências do Desempenho"
        text="As competências da avaliação de desempenho, na aba Desempenho da ficha do técnico. A ordem daqui é a ordem da avaliação. Com nota lançada, arquive em vez de excluir: a nota antiga continua valendo."
        action={<Button onClick={() => edit(null)}>Nova competência</Button>}
      />
      <PerformanceTarget />
      {competencies.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <ol className="flex flex-col gap-2">
        {list.length === 0 && competencies.data ? <Card>Nenhuma competência ainda.</Card> : null}
        {list.map((competency, index) => (
          <li key={competency.id}>
            <Card compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>
                <button
                  type="button"
                  className={`truncate text-left font-medium transition hover:text-accent hover:underline ${
                    competency.archived ? "text-muted" : "text-app"
                  }`}
                  onClick={() => edit(competency)}
                >
                  {competency.name}
                </button>
                {competency.archived ? (
                  <span className="shrink-0 rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted">Arquivada</span>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button
                  tone="ghost"
                  className={small}
                  aria-label={`Subir ${competency.name}`}
                  disabled={index === 0 || reorder.isPending}
                  onClick={() => reorder.mutate(moved(ids, index, -1))}
                >
                  ↑
                </Button>
                <Button
                  tone="ghost"
                  className={small}
                  aria-label={`Descer ${competency.name}`}
                  disabled={index === list.length - 1 || reorder.isPending}
                  onClick={() => reorder.mutate(moved(ids, index, 1))}
                >
                  ↓
                </Button>
                <Button
                  tone="ghost"
                  className={small}
                  disabled={save.isPending}
                  onClick={() => save.mutate({ id: competency.id, name: competency.name, archived: !competency.archived })}
                >
                  {competency.archived ? "Reativar" : "Arquivar"}
                </Button>
                {pendingDelete === competency.id ? (
                  <>
                    <Button
                      tone="danger"
                      className={small}
                      onClick={() => remove.mutate(competency.id, { onSuccess: () => setPendingDelete(null) })}
                    >
                      Confirmar
                    </Button>
                    <Button
                      tone="ghost"
                      className={small}
                      onClick={() => {
                        setPendingDelete(null);
                        remove.reset();
                      }}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    tone="ghost"
                    className={small}
                    onClick={() => {
                      remove.reset();
                      setPendingDelete(competency.id);
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            </Card>
          </li>
        ))}
      </ol>
      {error ? (
        <div className="mt-3">
          <Notice>{errorMessage(error)}</Notice>
        </div>
      ) : null}
      <p className="mt-6 text-sm text-muted">
        A matriz de habilidades por equipamento é outra coisa: fica na aba Matriz da ficha de cada técnico.
      </p>
      <Modal open={open} title={editing ? "Editar competência" : "Nova competência"} onClose={close}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing?.id, name, archived: editing?.archived ?? false }, { onSuccess: close });
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
