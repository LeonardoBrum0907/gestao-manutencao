import { useState } from "react";
import type { LineDto } from "@manutencao/shared";
import { Button, Card, SectionTitle } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { RemoveDialog } from "../../../design/ui/removal";
import { RowMenu } from "../../../design/ui/row-menu";
import { useToast } from "../../../design/ui/toast";
import { useDeleteLine, useFactories, useLines, useMachines } from "../data/cadastro";
import { machineStatusClass, machineStatusLabel } from "../model/labels";
import { LinePanel } from "./LinePanel";
import { MachineFormModal } from "./MachineFormModal";

// undefined: fechado; null: nova; linha: aberta.
type Open = { line: LineDto | null; removing?: boolean } | undefined;

export function LinesSection() {
  const lines = useLines();
  const factories = useFactories();
  const machines = useMachines();
  const remove = useDeleteLine();
  const toast = useToast();
  const [open, setOpen] = useState<Open>(undefined);
  const [removing, setRemoving] = useState<LineDto | null>(null);
  const [addingMachineTo, setAddingMachineTo] = useState<LineDto | null>(null);
  const factoryName = new Map(factories.data?.map((factory) => [factory.id, factory.name]));
  const machineCount = new Map<string, number>();
  for (const machine of machines.data ?? []) machineCount.set(machine.lineId, (machineCount.get(machine.lineId) ?? 0) + 1);

  return (
    <div>
      <SectionTitle
        title="Linhas"
        text="Clique numa linha para ver e editar tudo dela, inclusive as máquinas."
        action={<Button onClick={() => setOpen({ line: null })}>Nova linha</Button>}
      />
      {lines.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {lines.data?.length === 0 ? <Card>Nenhuma linha ainda.</Card> : null}
      {lines.data?.length ? (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card shadow-card">
          {lines.data.map((line) => {
            const count = machineCount.get(line.id) ?? 0;
            const marks = [line.internalCode ? `TAG ${line.internalCode}` : null, line.isDailyLine ? "Linha de GD" : null, line.isCritical ? "Apadrinhada" : null];
            return (
              <li key={line.id} className={`flex items-center gap-1 pr-2 ${open?.line?.id === line.id ? "bg-accent-soft" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpen({ line })}
                  className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3 text-left transition hover:bg-accent-soft"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-app">{line.name}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {[factoryName.get(line.factoryId) ?? "Fábrica", ...marks].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="hidden w-28 shrink-0 text-sm text-app sm:block">
                    {count ? `${count} ${count === 1 ? "máquina" : "máquinas"}` : "Sem máquinas"}
                  </span>
                  <span className={`hidden w-32 shrink-0 text-sm sm:block ${machineStatusClass(line.status) || "text-app"}`}>{machineStatusLabel(line.status)}</span>
                  <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted" />
                </button>
                <RowMenu
                  label={`Mais ações de ${line.name}`}
                  items={[
                    { label: "Editar", onSelect: () => setOpen({ line }) },
                    { label: "+ Máquina nesta linha", onSelect: () => setAddingMachineTo(line) },
                    { label: "Excluir…", danger: true, onSelect: () => setRemoving(line) },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
      {open ? <LinePanel key={open.line?.id ?? "nova"} line={open.line} onClose={() => setOpen(undefined)} /> : null}
      {addingMachineTo ? <MachineFormModal line={addingMachineTo} machine={null} onClose={() => setAddingMachineTo(null)} /> : null}
      {removing ? (
        <RemoveDialog
          path={`/api/lines/${removing.id}`}
          name={removing.name}
          removing={remove.isPending}
          error={remove.error}
          onCancel={() => {
            setRemoving(null);
            remove.reset();
          }}
          onConfirm={() =>
            remove.mutate(removing.id, {
              onSuccess: () => {
                toast({ text: `${removing.name} excluída.` });
                setRemoving(null);
              },
            })
          }
        />
      ) : null}
    </div>
  );
}
