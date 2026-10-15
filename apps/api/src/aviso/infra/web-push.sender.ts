import { Injectable } from "@nestjs/common";
import webpush, { WebPushError } from "web-push";
import { EnvService } from "../../env.module";
import type { PushOutcome, PushSenderPort, PushTarget } from "../application/push-ports";

// Aviso que não chega em 1 h perde o sentido (o resumo do dia seguinte cobre); o serviço de push descarta depois disso.
const TIME_TO_LIVE_SECONDS = 3600;
// Códigos com que os serviços de push dizem que a inscrição acabou (RFC 8030).
const GONE_STATUS = new Set([404, 410]);

/** Envio pela biblioteca web-push, com as chaves VAPID do .env. */
@Injectable()
export class WebPushSender implements PushSenderPort {
  constructor(private readonly env: EnvService) {}

  get publicKey(): string | null {
    return this.env.vapid?.publicKey ?? null;
  }

  async send(target: PushTarget, payload: string): Promise<PushOutcome> {
    const vapid = this.env.vapid;
    if (!vapid) return "failed";
    const subscription = { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } };
    try {
      await webpush.sendNotification(subscription, payload, { vapidDetails: vapid, TTL: TIME_TO_LIVE_SECONDS });
      return "sent";
    } catch (error) {
      return failureOutcome(error, target.endpoint);
    }
  }
}

function failureOutcome(error: unknown, endpoint: string): PushOutcome {
  const status = error instanceof WebPushError ? error.statusCode : null;
  if (status !== null && GONE_STATUS.has(status)) return "gone";
  const message = error instanceof Error ? error.message : String(error);
  console.warn(JSON.stringify({ event: "push_send_failed", host: new URL(endpoint).host, status, message }));
  return "failed";
}
