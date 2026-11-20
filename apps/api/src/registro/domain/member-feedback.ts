import { captureRecord } from "./capture";
import type { CaptureInput, RecordState } from "./record-state";

export type ObservationInput = Omit<CaptureInput, "type" | "memberId">;

/**
 * Observação gravada na ficha do colaborador: um feedback sobre a pessoa que fica só na ficha,
 * fora de Registros e do Dashboard (origem "ficha", pedido do Léo em 2026-11-20).
 * @example observationRecord("m1", { body: "Ajudou na troca", occurredAt: new Date(), tone: "positive" })
 */
export function observationRecord(memberId: string, input: ObservationInput): RecordState {
  return { ...captureRecord({ ...input, type: "feedback", memberId }), origin: "ficha" };
}
