import { useState } from "react";
import { Link } from "react-router-dom";
import type { LineDto, MachineOperationalStatus } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Field, Notice, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { PanelFooter, PanelSection, PanelTag, DetailModal } from "../../../design/ui/panel";
import { RemovalPrompt } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useDeleteLine, useFactories, useMachines, useSaveLine } from "../data/cadastro";
import { machineStatusClass, machineStatusLabel, machineStatusOptions } from "../model/labels";
import { MachineFormModal } from "./MachineFormModal";

type Draft = Omit<LineDto, "id">;

const empty: Draft = {
  name: "",
  factoryId: "",
  sector: "",
  manufacturer: "",
  internalCode: "",
  status: "implanting",
  notes: "",
  isDailyLine: false,
  isCritical: false,
};

function toDraft(line: LineDto): Draft {
  return {
    name: line.name,
    factoryId: line.factoryId,
    sector: line.sector ?? "",
    manufacturer: line.manufacturer ?? "",
    internalCode: line.internalCode ?? "",
    status: line.status,
    notes: line.notes ?? "",
    isDailyLine: line.isDailyLine,
    isCritical: line.isCritical,
  };
}

function toBody(draft: Draft): Draft {
  return {
    ...draft,
    sector: draft.sector || null,
    manufacturer: draft.manufacturer || null,
    internalCode: draft.internalCode || null,
    notes: draft.notes || null,
  };
}

// Tudo de uma linha num painel ao lado da lista: cadastro, marcas e as máquinas dela.
// Montado só enquanto está aberto: cada abertura começa da linha (ou do vazio) de novo.
export function LinePanel({ line, onClose }: { line: LineDto | null; onClose: () => void }) {
  const factories = useFactories();
  const machines = useMachines();
  const catalog = useMatrixCatalog();
  const save = useSaveLine();
  const remove = useDeleteLine();
  const toast = useToast();
  const [initial] = useState<Draft>(() => (line ? toDraft(line) : empty));
  const [draft, setDraft] = useState<Draft>(initial);
  const [removing, setRemoving] = useState(false);
  const [addingMachine, setAddingMachine] = useState(false);
  const mine = line ? (machines.data ?? []).filter((machine) => machine.lineId === line.id) : [];
  const modelName = new Map(catalog.data?.equipments.map((equipment) => [equipment.id, equipment.name]));
  const factoryName = factories.data?.find((factory) => factory.id === line?.factoryId)?.name;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  return (
    <>
      <DetailModal
        open
        eyebrow={line ? "Linha" : "Nova"}
        title={line ? line.name : "Nova linha"}
        meta={
          line ? (
            <>
              {factoryName ? <PanelTag>{factoryName}</PanelTag> : null}
              <PanelTag tone={line.status === "stopped" ? "danger" : "neutral"}>{machineStatusLabel(line.status)}</PanelTag>
              {line.isDailyLine ? <PanelTag tone="accent">Linha de GD</PanelTag> : null}
              {line.isCritical ? <PanelTag tone="accent">Apadrinhada</PanelTag> : null}
            </>
          ) : null
        }
        onClose={onClose}
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(
            { id: line?.id, body: toBody(draft) },
            {
              onSuccess: (saved) => {
                toast({ text: line ? "Alterações gravadas." : `${saved.name} cadastrada.` });
                onClose();
              },
            },
          );
        }}
        notice={
          line && removing ? (
            <RemovalPrompt
              path={`/api/lines/${line.id}`}
              name={line.name}
              removing={remove.isPending}
              error={remove.error}
              onCancel={() => {
                setRemoving(false);
                remove.reset();
              }}
              onConfirm={() =>
                remove.mutate(line.id, {
                  onSuccess: () => {
                    toast({ text: `${line.name} excluída.` });
                    onClose();
                  },
                })
              }
            />
          ) : null
        }
        footer={
          <PanelFooter
            saving={save.isPending}
            saveLabel={line ? "Gravar" : "Cadastrar linha"}
            dirty={Boolean(line) && dirty}
            onCancel={onClose}
            onRemove={line && !removing ? () => setRemoving(true) : undefined}
          />
        }
      >
        <div className="flex flex-col gap-6">
          <PanelSection title="Identificação">
            <Field label="Nome">
              <TextInput value={draft.name} placeholder="Ex.: Linha 06" onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Fábrica">
                <SelectInput value={draft.factoryId} onChange={(event) => setDraft({ ...draft, factoryId: event.target.value })}>
                  <option value="">Escolha</option>
                  {factories.data?.map((factory) => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Status">
                <SelectInput
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as MachineOperationalStatus })}
                >
                  {machineStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="TAG">
                <TextInput value={draft.internalCode ?? ""} onChange={(event) => setDraft({ ...draft, internalCode: event.target.value })} />
              </Field>
              <Field label="Setor">
                <TextInput value={draft.sector ?? ""} onChange={(event) => setDraft({ ...draft, sector: event.target.value })} />
              </Field>
            </div>
            <Field label="Fabricante">
              <TextInput value={draft.manufacturer ?? ""} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} />
            </Field>
          </PanelSection>
          <PanelSection title="Marcas">
            <label className="flex min-h-10 items-center gap-2.5 text-sm text-app">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-[var(--accent)]"
                checked={draft.isDailyLine}
                onChange={(event) => setDraft({ ...draft, isDailyLine: event.target.checked })}
              />
              Linha de Gerenciamento Diário
            </label>
            <label className="flex min-h-10 items-center gap-2.5 text-sm text-app">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-[var(--accent)]"
                checked={draft.isCritical}
                onChange={(event) => setDraft({ ...draft, isCritical: event.target.checked })}
              />
              Apadrinhada
            </label>
          </PanelSection>
          {line ? (
            <PanelSection
              title="Máquinas desta linha"
              action={
                <Button tone="ghost" className="px-3 py-1.5" onClick={() => setAddingMachine(true)}>
                  + Máquina
                </Button>
              }
            >
              <ul className="divide-y divide-line rounded-card border border-line">
                {mine.length === 0 ? <li className="px-3 py-3 text-sm text-muted">Nenhuma máquina ainda.</li> : null}
                {mine.map((machine) => (
                  <li key={machine.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium text-app">{machine.name}</span>
                      <span className="text-muted">
                        {" · "}
                        {machine.equipmentId ? (modelName.get(machine.equipmentId) ?? "Modelo") : "Sem modelo"}
                      </span>
                      {machine.status === "stopped" ? (
                        <span className={machineStatusClass(machine.status)}> · {machineStatusLabel(machine.status)}</span>
                      ) : null}
                    </span>
                    <Link to={`/maquinas/${machine.id}`} className="shrink-0 font-semibold text-accent hover:underline">
                      Abrir máquina →
                    </Link>
                  </li>
                ))}
              </ul>
            </PanelSection>
          ) : null}
          <Field label="Observações">
            <TextArea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
        </div>
      </DetailModal>
      {line && addingMachine ? <MachineFormModal line={line} machine={null} onClose={() => setAddingMachine(false)} /> : null}
    </>
  );
}
