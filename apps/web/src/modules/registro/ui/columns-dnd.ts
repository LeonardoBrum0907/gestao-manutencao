import { useEffect, useRef, useState } from "react";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Estado do arrastar entre listas (grupos do checklist, dias da Agenda): a prévia do lugar novo durante o
// arrastar e a gravação ao soltar. Quem desenha as listas usa `columnDropId` no contêiner vazio.

const COLUMN = "col:";

/** Id do contêiner de uma lista, para ela receber item mesmo vazia. Ex.: `useDroppable({ id: columnDropId("hoje") })`. */
export function columnDropId(key: string): string {
  return `${COLUMN}${key}`;
}

export type DndColumn = {
  key: string;
  ids: string[];
  // Recebe item vindo de outra lista (a lista de origem decide se o item pode sair: canMove).
  accepts?: boolean;
};

export type ColumnDrop = { id: string; from: string; to: string; order: string[] };

type Columns = Record<string, string[]>;

function columnsOf(lists: DndColumn[]): Columns {
  return Object.fromEntries(lists.map((list) => [list.key, list.ids]));
}

// Arrastar começa só depois de mexer o mouse um pouco (clique continua clique) ou de segurar o dedo
// um instante (rolar a tela continua rolando). Pelo teclado: foco no item, espaço, setas, espaço.
function useColumnSensors() {
  return useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

/**
 * Listas com arrastar entre elas. Devolve a ordem atual de cada lista (com a prévia do arrastar), o item
 * arrastado e as props do DndContext.
 * @example
 * const dnd = useColumnsDnd({ lists, canMove, onDrop });
 * <DndContext {...dnd.context}>{lists.map((list) => <Lista ids={dnd.columns[list.key]} />)}</DndContext>
 */
export function useColumnsDnd({
  lists,
  canMove = () => true,
  onDrop,
}: {
  lists: DndColumn[];
  canMove?: (id: string, from: string, to: string) => boolean;
  // Grava a mudança; se falhar, as listas voltam ao que os dados dizem.
  onDrop: (drop: ColumnDrop) => Promise<unknown>;
}) {
  const sensors = useColumnSensors();
  const [columns, setColumns] = useState<Columns>(() => columnsOf(lists));
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<string | null>(null);
  const signature = JSON.stringify(lists.map((list) => [list.key, list.ids]));
  const latest = useRef(lists);
  latest.current = lists;

  // A lista segue os dados, menos durante um arrastar (aí ela é a prévia do lugar novo). Depois de
  // soltar, a prévia fica até os dados novos chegarem, sem piscar a ordem antiga.
  useEffect(() => {
    if (!origin.current) setColumns(columnsOf(latest.current));
  }, [signature]);

  const byKey = new Map(lists.map((list) => [list.key, list]));

  function findColumn(id: UniqueIdentifier): string | null {
    const key = String(id);
    if (key.startsWith(COLUMN)) return key.slice(COLUMN.length);
    return Object.keys(columns).find((column) => columns[column]?.includes(key)) ?? null;
  }

  function cancel() {
    origin.current = null;
    setActiveId(null);
    setColumns(columnsOf(latest.current));
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    origin.current = findColumn(event.active.id);
  }

  // Passar por cima de outra lista já mostra o item lá, se a lista recebe e o item pode ir.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const id = String(active.id);
    const from = findColumn(active.id);
    const to = findColumn(over.id);
    if (!from || !to || from === to || !byKey.get(to)?.accepts || !origin.current || !canMove(id, origin.current, to)) return;
    setColumns((current) => {
      const target = current[to] ?? [];
      const overIndex = target.indexOf(String(over.id));
      const index = overIndex >= 0 ? overIndex : target.length;
      return {
        ...current,
        [from]: (current[from] ?? []).filter((item) => item !== id),
        [to]: [...target.slice(0, index), id, ...target.slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const from = origin.current;
    const column = findColumn(active.id);
    const overColumn = over ? findColumn(over.id) : null;
    if (!from || !column || overColumn !== column) {
      cancel();
      return;
    }
    origin.current = null;
    const list = columns[column] ?? [];
    const oldIndex = list.indexOf(id);
    const overIndex = list.indexOf(String(over?.id));
    const newIndex = overIndex >= 0 ? overIndex : list.length - 1;
    const order = oldIndex === newIndex ? list : arrayMove(list, oldIndex, newIndex);
    setColumns({ ...columns, [column]: order });
    setActiveId(null);
    if (column === from && order === list) return;
    onDrop({ id, from, to: column, order }).catch(() => setColumns(columnsOf(latest.current)));
  }

  return {
    columns,
    activeId,
    activeColumn: activeId ? findColumn(activeId) : null,
    context: { sensors, onDragStart, onDragOver, onDragEnd, onDragCancel: cancel },
  };
}
