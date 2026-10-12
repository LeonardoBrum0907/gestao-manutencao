import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { TeamEquipmentDto, TeamMatrixDto } from "@manutencao/shared";
import { moveColumn, UNLINKED_BLOCK_ID } from "../../model/team-columns";
import { canDragColumns, type TeamGrid as TeamGridModel } from "../../model/team-grid";
import type { TeamSortKey } from "../../model/team-rows";
import { ariaSort, BlockHeader, ColumnHeader, SortButton } from "./TeamGridHead";
import { TeamGridBody } from "./TeamGridBody";
import type { TeamControls } from "./use-team-controls";

function useColumnSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

// Grupos de irmãos que se trocam entre si: as linhas, e as colunas de cada bloco (máquinas de uma linha, ou os modelos).
function siblingSets(grid: TeamGridModel): string[][] {
  const lines = grid.columnBlocks.flatMap((block) => (block.id && block.id !== UNLINKED_BLOCK_ID ? [block.id] : []));
  return [lines, ...grid.columnBlocks.map((block) => block.columns.map((column) => column.id))];
}

type GridProps = { team: TeamMatrixDto; grid: TeamGridModel; controls: TeamControls };

export function TeamGrid({ team, grid, controls }: GridProps) {
  const sensors = useColumnSensors();
  const equipmentOf = new Map<string, TeamEquipmentDto>(team.equipments.map((equipment) => [equipment.id, equipment]));
  const draggable = canDragColumns(controls);
  const titled = controls.layout.columnGroup === "line";
  const sets = siblingSets(grid);

  function onSort(key: TeamSortKey) {
    const dir = controls.sort.key === key ? (controls.sort.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1;
    controls.setSearch({ sort: { key, dir } });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const siblings = sets.find((set) => set.includes(String(active.id)) && set.includes(String(over.id)));
    if (siblings) controls.saveLayout({ columnOrder: moveColumn(siblings, String(active.id), String(over.id), controls.layout.columnOrder) });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      {/* relative: os textos só para leitor de tela (sr-only, absolutos) ficam presos aqui e não alargam a página no celular. */}
      <div className="relative overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            {titled ? (
              <tr>
                <th className="sticky left-0 z-[3] bg-card" />
                <SortableContext items={sets[0]} strategy={horizontalListSortingStrategy}>
                  {grid.columnBlocks.map((block) => (
                    <BlockHeader key={block.id} block={block} draggable={draggable && block.id !== UNLINKED_BLOCK_ID} />
                  ))}
                </SortableContext>
                <th className="bg-card" />
              </tr>
            ) : null}
            <tr>
              <th aria-sort={ariaSort(controls.sort, "name")} className="sticky left-0 z-[3] bg-card px-4 pb-3 align-bottom">
                <SortButton sort={controls.sort} sortKey="name" onSort={onSort} className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  Técnico
                </SortButton>
              </th>
              {grid.columnBlocks.map((block, index) => (
                <SortableContext key={block.id ?? "modelos"} items={sets[index + 1]} strategy={horizontalListSortingStrategy}>
                  {block.columns.map((column) => (
                    <ColumnHeader key={column.id} column={column} equipment={equipmentOf.get(column.equipmentId)} draggable={draggable} sort={controls.sort} onSort={onSort} />
                  ))}
                </SortableContext>
              ))}
              <th aria-sort={ariaSort(controls.sort, "count")} className="bg-card px-3 pb-3 text-center align-bottom">
                <SortButton sort={controls.sort} sortKey="count" onSort={onSort} className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.06em] text-muted">
                  Qualificado em
                </SortButton>
              </th>
            </tr>
          </thead>
          <TeamGridBody team={team} columns={grid.columns} rowBlocks={grid.rowBlocks} view={controls.layout.view} />
        </table>
      </div>
    </DndContext>
  );
}
