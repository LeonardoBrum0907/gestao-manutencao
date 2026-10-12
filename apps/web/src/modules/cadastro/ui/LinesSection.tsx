import { useState } from "react";
import type { LineDto } from "@manutencao/shared";
import { Button, Card, SectionTitle } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { RemoveDialog } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useDeleteLine, useFactories, useLines, useMachines } from "../data/cadastro";
import { LinePanel } from "./LinePanel";
import { LINE_COLUMNS, lineStacked, type LineTableRow } from "./line-table";
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
  const rows: LineTableRow[] = (lines.data ?? []).map((line) => ({ line, factory: factoryName.get(line.factoryId) ?? "Fábrica", machines: machineCount.get(line.id) ?? 0 }));

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
        <DataTable
          label="Linhas"
          rows={rows}
          rowKey={(row) => row.line.id}
          columns={LINE_COLUMNS}
          stacked={lineStacked}
          groupBy={(row) => ({ key: row.line.factoryId, title: row.factory })}
          defaultSort={{ key: "name", direction: "asc" }}
          countLabel={(count) => `${count} ${count === 1 ? "linha" : "linhas"}`}
          selectedKey={open?.line?.id ?? null}
          onOpen={(row) => setOpen({ line: row.line })}
          menu={(row) => ({
            label: `Mais ações de ${row.line.name}`,
            items: [
              { label: "Editar", onSelect: () => setOpen({ line: row.line }) },
              { label: "+ Máquina nesta linha", onSelect: () => setAddingMachineTo(row.line) },
              { label: "Excluir…", danger: true, onSelect: () => setRemoving(row.line) },
            ],
          })}
        />
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
