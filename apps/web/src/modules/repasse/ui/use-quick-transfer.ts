import { useState } from "react";
import type { TeamMatrixDto } from "@manutencao/shared";
import { nextQuickStep, type QuickTarget, type QuickTransferDraft } from "../model/quick-transfer";

/** O que a grade da Matriz da equipe precisa para escolher as duas pessoas: quem já ensina e o clique. */
export type GridPicker = { teacherId: string | null; pick: (target: QuickTarget) => void };

/** Estado do repasse rápido na Matriz da equipe. */
export type QuickTransfer = {
  picker: GridPicker | null;
  teacherName: string | null;
  draft: QuickTransferDraft | null;
  start: () => void;
  stop: () => void;
  backToPicking: () => void;
};

// Equipamentos marcados na matriz de quem ensina: só eles podem virar foco do repasse.
function equipmentIdsOf(team: TeamMatrixDto, memberId: string | undefined): string[] {
  return team.members.find((member) => member.id === memberId)?.cells.map((cell) => cell.equipmentId) ?? [];
}

/**
 * Modo "Novo repasse" da Matriz da equipe: liga, recebe dois cliques e devolve o rascunho para a janela.
 * @example const quick = useQuickTransfer(team); quick.start(); quick.picker?.pick({ memberId: "m1", equipmentId: "e1" })
 */
export function useQuickTransfer(team: TeamMatrixDto): QuickTransfer {
  const [active, setActive] = useState(false);
  const [teacher, setTeacher] = useState<QuickTarget | null>(null);
  const [draft, setDraft] = useState<QuickTransferDraft | null>(null);

  function pick(target: QuickTarget) {
    const step = nextQuickStep(teacher, target, equipmentIdsOf(team, teacher?.memberId));
    setTeacher(step.teacher);
    setDraft(step.draft);
  }
  function stop() {
    setActive(false);
    setTeacher(null);
    setDraft(null);
  }

  return {
    picker: active ? { teacherId: teacher?.memberId ?? null, pick } : null,
    teacherName: team.members.find((member) => member.id === teacher?.memberId)?.name ?? null,
    draft,
    start: () => setActive(true),
    stop,
    backToPicking: () => setDraft(null),
  };
}
