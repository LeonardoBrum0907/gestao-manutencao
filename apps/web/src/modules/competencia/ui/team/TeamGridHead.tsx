import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TeamEquipmentDto } from "@manutencao/shared";
import type { ReactNode } from "react";
import { Icon } from "../../../../design/ui/icons";
import { coverageLabel } from "../../model/team";
import type { TeamColumn, TeamColumnBlock } from "../../model/team-columns";
import type { TeamSort, TeamSortKey } from "../../model/team-rows";

export const coverageChipClass: Record<TeamEquipmentDto["status"], string> = {
  ok: "bg-accent-soft text-accent-ink",
  single: "bg-warn-soft text-warn",
  short: "bg-danger-soft text-danger",
  none: "bg-danger-soft text-danger",
};

export function CoverageChip({ equipment }: { equipment: TeamEquipmentDto | undefined }) {
  if (!equipment) return null;
  const title = `${coverageLabel[equipment.status]}: ${equipment.qualified} qualificado(s)${equipment.minQualified ? `, mínimo ${equipment.minQualified}` : ", sem mínimo"}`;
  return (
    <span title={title} className={`rounded-full px-2 py-px text-[11px] font-semibold tabular-nums ${coverageChipClass[equipment.status]}`}>
      {equipment.qualified}
      {equipment.minQualified ? ` / ${equipment.minQualified}` : ""}
      <span className="sr-only"> qualificados, {coverageLabel[equipment.status]}</span>
    </span>
  );
}

export function ariaSort(sort: TeamSort, key: TeamSortKey): "ascending" | "descending" | undefined {
  if (sort.key !== key) return undefined;
  return sort.dir === 1 ? "ascending" : "descending";
}

// Clicar no título ordena os técnicos por ele; clicar de novo inverte.
export function SortButton({ sort, sortKey, onSort, children, className = "" }: { sort: TeamSort; sortKey: TeamSortKey; onSort: (key: TeamSortKey) => void; children: ReactNode; className?: string }) {
  const mark = sort.key === sortKey ? (sort.dir === 1 ? "▲" : "▼") : null;
  return (
    <button type="button" onClick={() => onSort(sortKey)} className={`rounded transition hover:text-accent hover:underline ${className}`}>
      {children}
      {mark ? <span className="ml-1 text-[10px] text-accent" aria-hidden="true">{mark}</span> : null}
    </button>
  );
}

function useSortableCell(id: string, disabled: boolean) {
  const sortable = useSortable({ id, disabled });
  const style = { transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition, zIndex: sortable.isDragging ? 5 : undefined };
  return { ...sortable, style };
}

function Grip({ label, handle }: { label: string; handle: ReturnType<typeof useSortableCell> }) {
  return (
    <button
      type="button"
      ref={handle.setActivatorNodeRef}
      {...handle.attributes}
      {...handle.listeners}
      aria-label={`Arrastar ${label}`}
      title="Arraste para trocar a ordem (no teclado: espaço e setas)"
      className="cursor-grab touch-none rounded px-1.5 text-muted transition hover:bg-chip hover:text-app active:cursor-grabbing"
    >
      <Icon name="grip" className="h-3.5 w-3.5" />
    </button>
  );
}

// Título de uma linha cadastrada, em cima das máquinas dela. Também se arrasta, para trocar a ordem das linhas.
export function BlockHeader({ block, draggable }: { block: TeamColumnBlock; draggable: boolean }) {
  const handle = useSortableCell(block.id ?? "", !draggable);
  return (
    <th ref={handle.setNodeRef} style={handle.style} colSpan={block.columns.length} className={`relative bg-card px-1 pb-1 pt-2 ${handle.isDragging ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-center gap-1 border-b-2 border-line-strong pb-1">
        {draggable ? <Grip label={`a linha ${block.label}`} handle={handle} /> : null}
        <span className="truncate text-xs font-semibold uppercase tracking-[0.06em] text-app" title={block.detail ? `${block.label} · ${block.detail}` : (block.label ?? "")}>
          {block.label}
        </span>
      </div>
    </th>
  );
}

type ColumnHeaderProps = { column: TeamColumn; equipment: TeamEquipmentDto | undefined; draggable: boolean; sort: TeamSort; onSort: (key: TeamSortKey) => void };

export function ColumnHeader({ column, equipment, draggable, sort, onSort }: ColumnHeaderProps) {
  const handle = useSortableCell(column.id, !draggable);
  const sortKey: TeamSortKey = `equipment:${column.equipmentId}`;
  return (
    <th
      ref={handle.setNodeRef}
      style={handle.style}
      aria-sort={ariaSort(sort, sortKey)}
      className={`relative min-w-[6.5rem] bg-card px-1 pb-2 align-bottom ${handle.isDragging ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        {draggable ? <Grip label={column.label} handle={handle} /> : null}
        <SortButton sort={sort} sortKey={sortKey} onSort={onSort} className="line-clamp-2 text-xs font-semibold leading-tight text-app">
          {column.label}
        </SortButton>
        {column.detail ? <span className="line-clamp-1 text-[11px] font-normal text-muted">{column.detail}</span> : null}
        <CoverageChip equipment={equipment} />
      </div>
    </th>
  );
}
