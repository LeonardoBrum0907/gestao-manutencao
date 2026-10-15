import type { PushDeviceDto } from "@manutencao/shared";
import type { PushDeviceWrite } from "../domain/push-subscription";

/** O que o envio precisa de um aparelho: o endereço e as duas chaves da inscrição. */
export type PushTarget = Pick<PushDeviceWrite, "endpoint" | "p256dh" | "auth">;

// "gone": o serviço de push disse que a inscrição não existe mais (aparelho desinstalou ou revogou).
export type PushOutcome = "sent" | "gone" | "failed";

export interface PushSenderPort {
  /** Chave pública que o navegador usa para se inscrever. Nula enquanto o .env não tiver as chaves. */
  readonly publicKey: string | null;
  send(target: PushTarget, payload: string): Promise<PushOutcome>;
}

export interface PushDeviceStore {
  list(): Promise<Array<PushDeviceDto & PushTarget>>;
  // Mesmo endereço de novo (o navegador renova as chaves) atualiza a linha em vez de duplicar.
  upsert(write: PushDeviceWrite): Promise<PushDeviceDto>;
  remove(id: string): Promise<boolean>;
  markSent(ids: string[], at: Date): Promise<void>;
}

export const PUSH_SENDER = Symbol("PUSH_SENDER");
export const PUSH_DEVICES = Symbol("PUSH_DEVICES");
