import { useState } from "react";
import { Link } from "react-router-dom";
import type { ChamadoBody, ChamadoDto, ChamadoShift, RecordPriority, RecordStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, MultiSelect, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { PanelFooter, PanelSection, PanelTag, DetailModal } from "../../../design/ui/panel";
import { RemovalPrompt } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useLines, useMachines, useMembers } from "../../cadastro/data/cadastro";
import { memberOptionLabel } from "../../cadastro/model/labels";
import { useDeleteRecord } from "../../registro/data/records";
import { formatDueDay } from "../../registro/model/follow-up";
import { priorityOptions, statusChipClass, statusLabel } from "../../registro/model/record";
import { rpStatusChipClass, rpStatusLabel } from "../../rp/model/rp";
import { useAddChamadoTask, useSaveChamado } from "../data/shift";
import {
  addDays,
  chamadoStatusChoices,
  chamadoStatusLabel,
  clock,
  closingInstant,
  dayOf,
  instant,
  nowClock,
  shiftChoices,
  shiftLabel,
  suggestShift,
  today,
} from "../model/chamado";

type Draft = {
  status: RecordStatus;
  lineMode: "line" | "other";
  lineId: string;
  lineLabel: string;
  machineId: string;
  body: string;
  day: string;
  opened: string;
  closed: string;
  shift: ChamadoShift | "";
  memberIds: string[];
  notes: string;
};

function blank(value: string): string | null {
  return value.trim() ? value.trim() : null;
}

function newDraft(day: string): Draft {
  // Chamado novo nasce agora, em andamento; num dia passado, só com o dia e a hora vazia.
  const now = new Date();
  const isToday = day === today();
  return {
    status: "in_progress",
    lineMode: "line",
    lineId: "",
    lineLabel: "",
    machineId: "",
    body: "",
    day,
    opened: isToday ? nowClock() : "",
    closed: "",
    shift: isToday ? suggestShift(now) : "",
    memberIds: [],
    notes: "",
  };
}

function toDraft(chamado: ChamadoDto): Draft {
  const opened = chamado.openedAt ?? chamado.occurredAt;
  return {
    status: chamado.status,
    lineMode: chamado.lineLabel ? "other" : "line",
    lineId: chamado.lineId ?? "",
    lineLabel: chamado.lineLabel ?? "",
    machineId: chamado.machineId ?? "",
    body: chamado.body,
    day: dayOf(new Date(opened)),
    opened: clock(opened),
    closed: clock(chamado.closedAt),
    shift: chamado.shift ?? "",
    memberIds: chamado.memberIds,
    notes: chamado.notes ?? "",
  };
}

function toBody(draft: Draft): ChamadoBody {
  const opened = draft.opened ? instant(draft.day, draft.opened) : null;
  return {
    body: draft.body,
    // Sem hora, a API recusa com a mensagem certa.
    openedAt: opened ? opened.toISOString() : "",
    closedAt: opened && draft.closed ? closingInstant(draft.day, draft.opened, draft.closed).toISOString() : null,
    shift: draft.shift || null,
    memberIds: draft.memberIds,
    lineId: draft.lineMode === "line" ? blank(draft.lineId) : null,
    lineLabel: draft.lineMode === "other" ? blank(draft.lineLabel) : null,
    machineId: draft.lineMode === "line" ? blank(draft.machineId) : null,
    status: draft.status,
    notes: blank(draft.notes),
  };
}

function Segmented<T extends string>({ label, value, choices, onChange }: { label: string; value: T | ""; choices: { value: T; label: string }[]; onChange: (next: T) => void }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm text-app">
      <span className="font-medium">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.value}
            type="button"
            aria-pressed={value === choice.value}
            onClick={() => onChange(choice.value)}
            className={`min-h-10 rounded-control border px-3 py-2 text-sm font-semibold transition ${
              value === choice.value ? "border-accent bg-accent-soft text-app" : "border-line bg-surface text-app hover:bg-chip"
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// "Gerar pendência": vira uma Tarefa com prazo, ligada ao chamado. Prazo padrão: depois de amanhã.
function TaskForm({ chamado, onDone }: { chamado: ChamadoDto; onDone: () => void }) {
  const members = useMembers();
  const add = useAddChamadoTask(chamado.id);
  const toast = useToast();
  const [body, setBody] = useState(chamado.body);
  const [due, setDue] = useState(addDays(today(), 2));
  const [memberId, setMemberId] = useState(chamado.memberIds[0] ?? "");
  const [priority, setPriority] = useState<RecordPriority | "">("high");

  function create() {
    add.mutate(
      { body, dueAt: instant(due, "12:00").toISOString(), memberId: memberId || null, priority: priority || null },
      {
        onSuccess: () => {
          toast({ text: "Pendência criada." });
          onDone();
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-control border border-line bg-surface p-3">
      <Field label="O que falta fazer">
        <TextInput value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Prazo">
          <TextInput type="date" value={due} onChange={(event) => setDue(event.target.value)} />
        </Field>
        <Field label="Responsável">
          <SelectInput value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="">Ninguém ainda</option>
            {members.data?.map((member) => (
              <option key={member.id} value={member.id}>
                {memberOptionLabel(member)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Prioridade">
          <SelectInput value={priority} onChange={(event) => setPriority(event.target.value as RecordPriority | "")}>
            <option value="">Sem prioridade</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {add.isError ? <Notice>{errorMessage(add.error)}</Notice> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button tone="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button onClick={create} disabled={add.isPending || !due}>
          {add.isPending ? "Criando…" : "Criar pendência"}
        </Button>
      </div>
    </div>
  );
}

const linkRow = "flex items-center justify-between gap-3 rounded-control border border-line bg-surface px-3 py-3 text-sm transition hover:bg-accent-soft";

function AfterChamado({ chamado }: { chamado: ChamadoDto }) {
  const [adding, setAdding] = useState(false);
  return (
    <PanelSection title="Depois do chamado">
      {chamado.tasks.map((task) => (
        <Link key={task.id} to={`/registros/${task.id}`} className={linkRow}>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-muted">Pendência gerada{task.dueAt ? ` · prazo ${formatDueDay(task.dueAt)}` : ""}</span>
            <span className="mt-0.5 line-clamp-2 block font-medium text-app">{task.body}</span>
          </span>
          <span className={`${statusChipClass(task.status)} shrink-0`}>{statusLabel(task.status)}</span>
        </Link>
      ))}
      {adding ? (
        <TaskForm chamado={chamado} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`${linkRow} text-left`}>
          <span>
            <span className="block font-semibold text-app">{chamado.tasks.length ? "Gerar outra pendência" : "Gerar pendência"}</span>
            <span className="mt-0.5 block text-muted">Cria uma Tarefa com prazo e responsável, ligada a este chamado.</span>
          </span>
          <span aria-hidden className="text-xl text-accent">
            +
          </span>
        </button>
      )}
      {chamado.rp ? (
        <Link to={`/rp/${chamado.rp.id}`} className={linkRow}>
          <span className="font-semibold text-app">RP deste chamado</span>
          <span className={`${rpStatusChipClass(chamado.rp.status)} shrink-0`}>{rpStatusLabel(chamado.rp.status)}</span>
        </Link>
      ) : (
        <Link to={`/rp/novo?chamado=${chamado.id}`} className={linkRow}>
          <span>
            <span className="block font-semibold text-app">Escrever RP</span>
            <span className="mt-0.5 block text-muted">Abre o RP com linha, técnicos e problema já preenchidos.</span>
          </span>
          <span aria-hidden className="text-xl text-accent">
            +
          </span>
        </Link>
      )}
    </PanelSection>
  );
}

// Chamado inteiro num painel ao lado da lista do dia. Montado só enquanto está aberto.
export function ChamadoPanel({ chamado, day, onClose, onCreated }: { chamado: ChamadoDto | null; day: string; onClose: () => void; onCreated: (saved: ChamadoDto) => void }) {
  const lines = useLines();
  const machines = useMachines();
  const members = useMembers();
  const save = useSaveChamado(chamado?.id);
  const remove = useDeleteRecord();
  const toast = useToast();
  const [initial] = useState<Draft>(() => (chamado ? toDraft(chamado) : newDraft(day)));
  const [draft, setDraft] = useState<Draft>(initial);
  const [removing, setRemoving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const lineMachines = (machines.data ?? []).filter((machine) => machine.lineId === draft.lineId);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const title = chamado ? chamado.body : "Novo chamado";
  const eyebrow = chamado
    ? `Chamado${chamado.dayNumber ? ` nº ${chamado.dayNumber}` : ""}${chamado.shift ? ` · ${shiftLabel(chamado.shift)}` : ""}`
    : "Novo";

  return (
    <DetailModal
      open
      eyebrow={eyebrow}
      title={title}
      meta={chamado ? <PanelTag tone={chamado.status === "open" ? "danger" : chamado.status === "in_progress" ? "accent" : "neutral"}>{chamadoStatusLabel(chamado.status)}</PanelTag> : null}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate(toBody(draft), {
          onSuccess: (saved) => {
            if (chamado) {
              toast({ text: "Chamado gravado." });
              onClose();
            } else {
              toast({ text: `Chamado nº ${saved.dayNumber ?? ""} aberto.` });
              onCreated(saved);
            }
          },
        });
      }}
      notice={
        chamado && removing ? (
          <RemovalPrompt
            path={`/api/records/${chamado.id}`}
            name={`chamado${chamado.dayNumber ? ` nº ${chamado.dayNumber}` : ""}`}
            removing={remove.isPending}
            error={remove.error}
            onCancel={() => {
              setRemoving(false);
              remove.reset();
            }}
            onConfirm={() =>
              remove.mutate(chamado.id, {
                onSuccess: () => {
                  toast({ text: "Chamado excluído." });
                  onClose();
                },
              })
            }
          />
        ) : save.isError ? (
          <Notice>{errorMessage(save.error)}</Notice>
        ) : null
      }
      footer={
        <PanelFooter
          saving={save.isPending}
          saveLabel={chamado ? "Gravar" : "Abrir chamado"}
          dirty={Boolean(chamado) && dirty}
          onCancel={onClose}
          onRemove={chamado && !removing ? () => setRemoving(true) : undefined}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <Segmented label="Status" value={draft.status} choices={chamadoStatusChoices} onChange={(status) => set("status", status)} />

        <div className="flex flex-col gap-3">
          {draft.lineMode === "line" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Linha">
                <SelectInput
                  value={draft.lineId}
                  searchable
                  onChange={(event) => setDraft((current) => ({ ...current, lineId: event.target.value, machineId: "" }))}
                >
                  <option value="">Escolha a linha</option>
                  {lines.data?.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Máquina, se souber">
                <SelectInput value={draft.machineId} disabled={!lineMachines.length} onChange={(event) => set("machineId", event.target.value)}>
                  <option value="">{draft.lineId && !lineMachines.length ? "Linha sem máquinas cadastradas" : "Não sei / a linha toda"}</option>
                  {lineMachines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
          ) : (
            <Field label="Equipamento fora do cadastro">
              <TextInput value={draft.lineLabel} placeholder="Descreva o equipamento" onChange={(event) => set("lineLabel", event.target.value)} />
            </Field>
          )}
          <button
            type="button"
            onClick={() => set("lineMode", draft.lineMode === "line" ? "other" : "line")}
            className="self-start text-sm font-semibold text-accent hover:underline"
          >
            {draft.lineMode === "line" ? "Não está no cadastro? Descrever" : "Escolher uma linha cadastrada"}
          </button>
        </div>

        <Field label="O que aconteceu">
          <TextArea className="min-h-24" value={draft.body} placeholder="Ex.: esteira travando na entrada do magazine" onChange={(event) => set("body", event.target.value)} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Dia">
            <TextInput type="date" value={draft.day} onChange={(event) => set("day", event.target.value)} />
          </Field>
          <Field label="Abertura">
            <TextInput type="time" value={draft.opened} onChange={(event) => set("opened", event.target.value)} />
          </Field>
          <div className="flex min-w-0 flex-col gap-1.5 text-sm text-app">
            <span className="flex items-baseline justify-between gap-2">
              <label htmlFor="chamado-fechamento" className="font-medium">
                Fechamento
              </label>
              <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={() => set("closed", nowClock())}>
                Agora
              </button>
            </span>
            <TextInput id="chamado-fechamento" type="time" value={draft.closed} onChange={(event) => set("closed", event.target.value)} />
          </div>
        </div>

        <Segmented
          label="Turno"
          value={draft.shift}
          choices={shiftChoices.map((choice) => ({ value: choice.value, label: shiftLabel(choice.value) }))}
          onChange={(shift) => set("shift", shift)}
        />

        <MultiSelect
          label="Técnicos"
          placeholder="Selecione os técnicos"
          emptyText="Nenhum técnico cadastrado."
          options={(members.data ?? []).map((member) => ({ value: member.id, label: memberOptionLabel(member) }))}
          value={draft.memberIds}
          onChange={(memberIds) => set("memberIds", memberIds)}
        />

        <Field label="Observação">
          <TextArea className="min-h-20" value={draft.notes} onChange={(event) => set("notes", event.target.value)} />
        </Field>

        {chamado ? <AfterChamado chamado={chamado} /> : null}
      </div>
    </DetailModal>
  );
}

