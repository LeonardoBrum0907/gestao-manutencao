import { useState, type FormEvent } from "react";
import {
  PDI_ITEM_STATUSES,
  PDI_ITEM_STATUS_LABELS,
  type MatrixCatalogDto,
  type MemberDto,
  type PdiItemDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useMachines, useMembers } from "../../cadastro/data/cadastro";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useMatrix } from "../../competencia/data/matrix";
import { entriesById, equipmentName, skillState } from "../../competencia/model/matrix";
import { usePdiItems, useRemovePdiItem, useSavePdiItem } from "../data/pdi-items";
import { formatDay, isOverdue, itemCounts, sortItems, todayIso, type PdiItemWrite } from "../model/pdi-items";

const emptyWrite: PdiItemWrite = {
  title: "",
  skillId: null,
  machineId: null,
  responsibleId: null,
  dueDate: null,
  status: "planned",
  notes: null,
};

function toWrite(item: PdiItemDto): PdiItemWrite {
  const { title, skillId, machineId, responsibleId, dueDate, status, notes } = item;
  return { title, skillId, machineId, responsibleId, dueDate, status, notes };
}

type SkillOption = { id: string; label: string };

// Habilidades da matriz do técnico que estão abaixo do esperado (as lacunas) mais a que o item já usa.
function useGapOptions(memberId: string, catalog: MatrixCatalogDto | undefined, keep: string | null): SkillOption[] {
  const matrix = useMatrix(memberId);
  if (!catalog || !matrix.data) return [];
  const entries = entriesById(matrix.data.entries);
  return catalog.skills
    .filter((skill) => !skill.archived && matrix.data.equipments.includes(skill.equipmentId))
    .filter((skill) => skill.id === keep || skillState(skill, entries.get(skill.id)) === "below")
    .map((skill) => ({ id: skill.id, label: `${equipmentName(catalog, skill.equipmentId)} · ${skill.text}` }));
}

function ItemForm({
  member,
  initial,
  itemId,
  onDone,
}: {
  member: MemberDto;
  initial: PdiItemWrite;
  itemId?: string;
  onDone: () => void;
}) {
  const save = useSavePdiItem(member.id);
  const catalog = useMatrixCatalog();
  const machines = useMachines();
  const members = useMembers();
  const [form, setForm] = useState(initial);
  const skills = useGapOptions(member.id, catalog.data, initial.skillId);
  const set = <K extends keyof PdiItemWrite>(key: K, value: PdiItemWrite[K]) => setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate({ id: itemId, ...form, notes: form.notes?.trim() || null }, { onSuccess: onDone });
  }

  return (
    <form className="flex flex-col gap-3 border-t border-t-line px-4 py-4" noValidate onSubmit={submit}>
      <Field label="Ação">
        <TextInput value={form.title} maxLength={200} placeholder="Ex.: acompanhar o padrinho na troca de bobina" onChange={(event) => set("title", event.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lacuna da matriz (opcional)">
          <SelectInput value={form.skillId ?? ""} onChange={(event) => set("skillId", event.target.value || null)}>
            <option value="">—</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Máquina (opcional)">
          <SelectInput value={form.machineId ?? ""} onChange={(event) => set("machineId", event.target.value || null)}>
            <option value="">—</option>
            {(machines.data ?? []).map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Responsável / padrinho">
          <SelectInput value={form.responsibleId ?? ""} onChange={(event) => set("responsibleId", event.target.value || null)}>
            <option value="">—</option>
            {(members.data ?? [])
              .filter((item) => item.id !== member.id && item.status === "active")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </SelectInput>
        </Field>
        <Field label="Prazo">
          <TextInput type="date" value={form.dueDate ?? ""} onChange={(event) => set("dueDate", event.target.value || null)} />
        </Field>
        <Field label="Status">
          <SelectInput value={form.status} onChange={(event) => set("status", event.target.value as PdiItemWrite["status"])}>
            {PDI_ITEM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PDI_ITEM_STATUS_LABELS[status]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <Field label="Observação (opcional)">
        <TextArea value={form.notes ?? ""} maxLength={1000} onChange={(event) => set("notes", event.target.value)} />
      </Field>
      {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending || !form.title.trim()}>
          {itemId ? "Salvar item" : "Adicionar item"}
        </Button>
        <Button tone="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function PdiItems({ member }: { member: MemberDto }) {
  const items = usePdiItems(member.id);
  const catalog = useMatrixCatalog();
  const machines = useMachines();
  const members = useMembers();
  const save = useSavePdiItem(member.id);
  const remove = useRemovePdiItem(member.id);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const today = todayIso();
  const list = sortItems(items.data ?? []);
  const counts = itemCounts(list, today);
  const skillText = new Map((catalog.data?.skills ?? []).map((skill) => [skill.id, skill.text]));
  const machineName = new Map((machines.data ?? []).map((machine) => [machine.id, machine.name]));
  const memberName = new Map((members.data ?? []).map((item) => [item.id, item.name]));

  return (
    <Card compact className="overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-app">Plano de ação do PDI</h2>
          <p className="mt-1 text-xs text-muted">
            {counts.open} em aberto · {counts.overdue ? <span className="font-semibold text-danger">{counts.overdue} atrasado(s)</span> : "0 atrasado"} ·{" "}
            {counts.done} concluído(s)
          </p>
        </div>
        {editing !== "new" ? (
          <Button tone="ghost" className="px-3 py-1.5" onClick={() => setEditing("new")}>
            + Item
          </Button>
        ) : null}
      </div>
      {editing === "new" ? <ItemForm member={member} initial={emptyWrite} onDone={() => setEditing(null)} /> : null}
      {items.isError ? <Notice>{errorMessage(items.error)}</Notice> : null}
      {items.isSuccess && list.length === 0 && editing !== "new" ? (
        <p className="border-t border-t-line px-4 py-3 text-sm text-muted">
          Nenhum item ainda. Cada ação pode nascer de uma lacuna da matriz, com prazo e responsável.
        </p>
      ) : null}
      <ul>
        {list.map((item) =>
          editing === item.id ? (
            <li key={item.id}>
              <ItemForm member={member} initial={toWrite(item)} itemId={item.id} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={item.id} className="flex flex-col gap-2 border-t border-t-line px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={`min-w-0 text-sm font-medium ${item.status === "cancelled" ? "text-muted line-through" : "text-app"}`}>{item.title}</p>
                <SelectInput
                  aria-label={`Status de ${item.title}`}
                  className="!w-auto !py-1.5"
                  value={item.status}
                  disabled={save.isPending}
                  onChange={(event) => save.mutate({ id: item.id, status: event.target.value as PdiItemWrite["status"] })}
                >
                  {PDI_ITEM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PDI_ITEM_STATUS_LABELS[status]}
                    </option>
                  ))}
                </SelectInput>
              </div>
              <p className="text-xs text-muted">
                <span className={isOverdue(item, today) ? "font-semibold text-danger" : ""}>
                  Prazo {formatDay(item.dueDate)}
                  {isOverdue(item, today) ? " (atrasado)" : ""}
                </span>
                {item.responsibleId ? ` · Responsável ${memberName.get(item.responsibleId) ?? ""}` : ""}
                {item.machineId ? ` · ${machineName.get(item.machineId) ?? ""}` : ""}
                {item.skillId ? ` · Lacuna: ${skillText.get(item.skillId) ?? ""}` : ""}
                {item.completedAt ? ` · Concluído em ${formatDay(item.completedAt.slice(0, 10))}` : ""}
              </p>
              {item.notes ? <p className="whitespace-pre-line text-sm text-app">{item.notes}</p> : null}
              <div className="flex gap-2">
                <Button tone="ghost" className="px-3 py-1" onClick={() => setEditing(item.id)}>
                  Editar
                </Button>
                <Button tone="ghost" className="px-3 py-1" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>
                  Remover
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
      {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
      {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
    </Card>
  );
}
