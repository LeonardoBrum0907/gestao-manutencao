import { Inject, Injectable } from "@nestjs/common";
import type { PushConfigDto, PushDeviceDto, PushMessage, PushSendResultDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { pushPayload, testPushMessage } from "../domain/push-message";
import { readPushSubscription } from "../domain/push-subscription";
import { PUSH_DEVICES, PUSH_SENDER, type PushDeviceStore, type PushSenderPort } from "./push-ports";

// As chaves da inscrição ficam só no servidor: a tela recebe o endereço para reconhecer o próprio aparelho.
function publicDevice({ id, endpoint, label, createdAt, lastSentAt }: PushDeviceDto): PushDeviceDto {
  return { id, endpoint, label, createdAt, lastSentAt };
}

const MISSING_KEYS = "O servidor ainda não tem as chaves dos avisos: defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no .env e reinicie a API.";

/** Aparelhos inscritos para receber avisos e o envio para todos eles. */
@Injectable()
export class PushDevices {
  constructor(
    @Inject(PUSH_DEVICES) private readonly devices: PushDeviceStore,
    @Inject(PUSH_SENDER) private readonly sender: PushSenderPort,
  ) {}

  async config(): Promise<PushConfigDto> {
    const devices = await this.devices.list();
    return { publicKey: this.sender.publicKey, devices: devices.map(publicDevice) };
  }

  async subscribe(body: unknown): Promise<PushDeviceDto> {
    if (!this.sender.publicKey) throw new DomainError("push_keys", 503, MISSING_KEYS);
    return this.devices.upsert(readPushSubscription(body));
  }

  async remove(id: string): Promise<void> {
    if (!(await this.devices.remove(id))) throw new DomainError("not_found", 404, `Aparelho não encontrado: ${id}.`);
  }

  sendTest(now: Date): Promise<PushSendResultDto> {
    return this.deliver(testPushMessage(now), now);
  }

  /**
   * Manda o aviso para todos os aparelhos. Inscrição que o serviço diz não existir mais é apagada.
   * @example await pushDevices.deliver({ title: "Chamado aberto há 2 h", body: "…", url: "/turno/chamados", tag: "chamado:1" }, new Date())
   */
  async deliver(message: PushMessage, now: Date): Promise<PushSendResultDto> {
    if (!this.sender.publicKey) throw new DomainError("push_keys", 503, MISSING_KEYS);
    const devices = await this.devices.list();
    const payload = pushPayload(message);
    const outcomes = await Promise.all(devices.map(async (device) => ({ id: device.id, outcome: await this.sender.send(device, payload) })));
    const idsWith = (outcome: string) => outcomes.filter((item) => item.outcome === outcome).map((item) => item.id);
    await Promise.all(idsWith("gone").map((id) => this.devices.remove(id)));
    await this.devices.markSent(idsWith("sent"), now);
    return { sent: idsWith("sent").length, removed: idsWith("gone").length, failed: idsWith("failed").length };
  }
}
