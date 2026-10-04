import { useState, type FormEvent } from "react";
import {
  COMPETENCY_LEVEL_LABELS,
  COMPETENCY_LEVELS,
  type CompetencyLevel,
  type MatrixCatalogDto,
  type MatrixEquipmentDto,
  type MatrixSkillDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, SectionTitle, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import {
  useDeleteEquipment,
  useDeleteSkill,
  useMatrixCatalog,
  useReorderEquipments,
  useReorderSkills,
  useSaveEquipment,
  useSaveSkill,
  type SkillInput,
} from "../data/catalog";
import { matchesSearch } from "../model/matrix";

const small = "px-3 py-1.5";

function moved(ids: string[], index: number, step: -1 | 1): string[] {
  const next = [...ids];
  [next[index], next[index + step]] = [next[index + step], next[index]];
  return next;
}

function ArchivedChip() {
  return <span className="shrink-0 rounded-control bg-chip px-2 py-1 text-xs font-medium text-muted">Arquivado</span>;
}

// Excluir pede confirmação na própria linha, como no resto do cadastro.
function DeleteButton({ onConfirm, pending }: { onConfirm: (done: () => void) => void; pending: boolean }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button tone="ghost" className={small} onClick={() => setAsking(true)}>
        Excluir
      </Button>
    );
  }
  return (
    <>
      <Button tone="danger" className={small} disabled={pending} onClick={() => onConfirm(() => setAsking(false))}>
        Confirmar
      </Button>
      <Button tone="ghost" className={small} onClick={() => setAsking(false)}>
        Cancelar
      </Button>
    </>
  );
}

function OrderButtons({
  label,
  index,
  count,
  onMove,
  disabled,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (step: -1 | 1) => void;
  disabled: boolean;
}) {
  return (
    <>
      <Button tone="ghost" className={small} aria-label={`Subir ${label}`} disabled={disabled || index === 0} onClick={() => onMove(-1)}>
        ↑
      </Button>
      <Button
        tone="ghost"
        className={small}
        aria-label={`Descer ${label}`}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(1)}
      >
        ↓
      </Button>
    </>
  );
}

function Equipments({ catalog }: { catalog: MatrixCatalogDto }) {
  const save = useSaveEquipment();
  const remove = useDeleteEquipment();
  const reorder = useReorderEquipments();
  const [editing, setEditing] = useState<MatrixEquipmentDto | null | undefined>(undefined);
  const [name, setName] = useState("");
  const ids = catalog.equipments.map((equipment) => equipment.id);
  const activeSkills = (id: string) => catalog.skills.filter((skill) => skill.equipmentId === id && !skill.archived).length;

  function open(equipment: MatrixEquipmentDto | null) {
    save.reset();
    setEditing(equipment);
    setName(equipment?.name ?? "");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ id: editing?.id, name, archived: editing?.archived ?? false }, { onSuccess: () => setEditing(undefined) });
  }

  const error = (editing === undefined ? save.error : null) ?? remove.error ?? reorder.error;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-app">Equipamentos</h3>
        <Button tone="ghost" className={small} onClick={() => open(null)}>
          Novo equipamento
        </Button>
      </div>
      {error ? (
        <div className="mt-3">
          <Notice>{errorMessage(error)}</Notice>
        </div>
      ) : null}
      <ol className="mt-3 flex flex-col">
        {catalog.equipments.map((equipment, index) => (
          <li
            key={equipment.id}
            className="flex flex-col gap-2 border-t border-t-line py-2 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{index + 1}</span>
              <button
                type="button"
                className={`truncate text-left font-medium transition hover:text-accent hover:underline ${
                  equipment.archived ? "text-muted" : "text-app"
                }`}
                onClick={() => open(equipment)}
              >
                {equipment.name}
              </button>
              <span className="shrink-0 text-xs text-muted">{activeSkills(equipment.id)} habilidades</span>
              {equipment.archived ? <ArchivedChip /> : null}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <OrderButtons
                label={equipment.name}
                index={index}
                count={ids.length}
                disabled={reorder.isPending}
                onMove={(step) => reorder.mutate(moved(ids, index, step))}
              />
              <Button
                tone="ghost"
                className={small}
                disabled={save.isPending}
                onClick={() => save.mutate({ id: equipment.id, name: equipment.name, archived: !equipment.archived })}
              >
                {equipment.archived ? "Reativar" : "Arquivar"}
              </Button>
              <DeleteButton pending={remove.isPending} onConfirm={(done) => remove.mutate(equipment.id, { onSuccess: done })} />
            </div>
          </li>
        ))}
      </ol>
      <Modal open={editing !== undefined} title={editing ? "Editar equipamento" : "Novo equipamento"} onClose={() => setEditing(undefined)}>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field label="Nome">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              Gravar
            </Button>
            <Button tone="ghost" onClick={() => setEditing(undefined)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

const blankSkill = (equipmentId: string): SkillInput => ({ equipmentId, subgroup: "", text: "", level: "basic", archived: false });

function SkillForm({
  catalog,
  skill,
  equipmentId,
  onClose,
}: {
  catalog: MatrixCatalogDto;
  skill: MatrixSkillDto | null;
  equipmentId: string;
  onClose: () => void;
}) {
  const save = useSaveSkill();
  const [draft, setDraft] = useState<SkillInput>(() => (skill ? { ...skill } : blankSkill(equipmentId)));
  const subgroups = [...new Set(catalog.skills.filter((item) => item.equipmentId === draft.equipmentId).map((item) => item.subgroup))];

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ ...draft, id: skill?.id }, { onSuccess: onClose });
  }

  return (
    <Modal open title={skill ? "Editar habilidade" : "Nova habilidade"} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <Field label="Equipamento">
          <SelectInput value={draft.equipmentId} onChange={(event) => setDraft({ ...draft, equipmentId: event.target.value })}>
            {catalog.equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name}
                {equipment.archived ? " (arquivado)" : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Subconjunto">
          <TextInput
            list="matrix-subgroups"
            value={draft.subgroup}
            placeholder="Ex.: Selagem"
            onChange={(event) => setDraft({ ...draft, subgroup: event.target.value })}
          />
          <datalist id="matrix-subgroups">
            {subgroups.map((subgroup) => (
              <option key={subgroup} value={subgroup} />
            ))}
          </datalist>
        </Field>
        <Field label="Habilidade">
          <TextArea value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} />
        </Field>
        <Field label="Nível">
          <SelectInput value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value as CompetencyLevel })}>
            {COMPETENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {COMPETENCY_LEVEL_LABELS[level]}
              </option>
            ))}
          </SelectInput>
        </Field>
        {skill && skill.equipmentId !== draft.equipmentId ? (
          <p className="text-sm text-muted">Ao mudar de equipamento, a habilidade vai para o fim da lista dele. As notas já dadas continuam.</p>
        ) : null}
        {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>
            Gravar
          </Button>
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Skills({ catalog }: { catalog: MatrixCatalogDto }) {
  const [equipmentId, setEquipmentId] = useState(catalog.equipments[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MatrixSkillDto | null | undefined>(undefined);
  const save = useSaveSkill();
  const remove = useDeleteSkill();
  const reorder = useReorderSkills();
  const all = catalog.skills.filter((skill) => skill.equipmentId === equipmentId);
  const ids = all.map((skill) => skill.id);
  const visible = all.filter((skill) => matchesSearch(skill, query));
  const error = save.error ?? remove.error ?? reorder.error;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-app">Habilidades</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <Field label="Equipamento">
          <SelectInput value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)}>
            {catalog.equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name}
                {equipment.archived ? " (arquivado)" : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Buscar">
          <TextInput value={query} placeholder="Ex.: selagem, sensor" onChange={(event) => setQuery(event.target.value)} />
        </Field>
        <Button disabled={!equipmentId} onClick={() => setEditing(null)}>
          Nova habilidade
        </Button>
      </div>
      {query ? <p className="mt-2 text-xs text-muted">Para mudar a ordem, limpe a busca.</p> : null}
      {error && editing === undefined ? (
        <div className="mt-3">
          <Notice>{errorMessage(error)}</Notice>
        </div>
      ) : null}
      <ol className="mt-3 flex flex-col">
        {visible.length === 0 ? <li className="py-2 text-sm text-muted">Nenhuma habilidade.</li> : null}
        {visible.map((skill) => {
          const index = ids.indexOf(skill.id);
          return (
            <li
              key={skill.id}
              className="flex flex-col gap-2 border-t border-t-line py-3 first:border-t-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <button type="button" className="min-w-0 text-left" onClick={() => setEditing(skill)}>
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {skill.subgroup} · {COMPETENCY_LEVEL_LABELS[skill.level]}
                </span>
                <span
                  className={`mt-1 block text-sm transition hover:text-accent hover:underline ${
                    skill.archived ? "text-muted" : "text-app"
                  }`}
                >
                  {skill.text}
                </span>
                {skill.archived ? (
                  <span className="mt-1 inline-block">
                    <ArchivedChip />
                  </span>
                ) : null}
              </button>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <OrderButtons
                  label={skill.text}
                  index={index}
                  count={ids.length}
                  disabled={reorder.isPending || Boolean(query)}
                  onMove={(step) => reorder.mutate({ equipmentId, ids: moved(ids, index, step) })}
                />
                <Button
                  tone="ghost"
                  className={small}
                  disabled={save.isPending}
                  onClick={() => save.mutate({ ...skill, archived: !skill.archived })}
                >
                  {skill.archived ? "Reativar" : "Arquivar"}
                </Button>
                <DeleteButton pending={remove.isPending} onConfirm={(done) => remove.mutate(skill.id, { onSuccess: done })} />
              </div>
            </li>
          );
        })}
      </ol>
      {editing !== undefined ? (
        <SkillForm catalog={catalog} skill={editing} equipmentId={equipmentId} onClose={() => setEditing(undefined)} />
      ) : null}
    </Card>
  );
}

export function MatrixCatalogSection() {
  const catalog = useMatrixCatalog();
  return (
    <div>
      <SectionTitle
        title="Matriz de habilidades"
        text="Os equipamentos e as habilidades da aba Matriz da ficha do técnico. Com nota ou marcação, arquive em vez de excluir: o que já foi avaliado fica guardado e volta se reativar."
      />
      {catalog.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {catalog.isError ? <Notice>{errorMessage(catalog.error)}</Notice> : null}
      {catalog.data ? (
        <div className="flex flex-col gap-6">
          <Equipments catalog={catalog.data} />
          <Skills catalog={catalog.data} />
        </div>
      ) : null}
    </div>
  );
}
