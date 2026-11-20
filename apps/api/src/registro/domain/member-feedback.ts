import { captureRecord } from "./capture";
import type { CaptureInput, RecordState } from "./record-state";

export type MemberFeedbackInput = Omit<CaptureInput, "type" | "memberId">;

/**
 * Feedback completo que o gestor grava na ficha do colaborador. Fica só na ficha, fora de Registros
 * e do Dashboard (origem "ficha", pedido do Léo em 2026-11-20). O que Registros chama de Observação
 * é o tipo "feedback" com outra origem.
 * @example memberFeedbackRecord("m1", { body: "Conversamos sobre a troca", occurredAt: new Date(), tone: "positive" })
 */
export function memberFeedbackRecord(memberId: string, input: MemberFeedbackInput): RecordState {
  return { ...captureRecord({ ...input, type: "feedback", memberId }), origin: "ficha" };
}
