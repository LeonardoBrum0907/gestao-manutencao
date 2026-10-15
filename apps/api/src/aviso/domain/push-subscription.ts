import { DomainError } from "../../kernel/domain-error";
import { isRecord, optionalString, readObject } from "../../kernel/parse";

/** Inscrição de um aparelho, já conferida, como fica gravada. */
export type PushDeviceWrite = { endpoint: string; p256dh: string; auth: string; label: string | null };

// Endereços dos serviços de push (Google, Mozilla, Apple) passam de 200 caracteres; 2048 sobra.
const ENDPOINT_MAX_LENGTH = 2048;
const KEY_MAX_LENGTH = 200;
const LABEL_MAX_LENGTH = 120;
const BASE64URL = /^[A-Za-z0-9_-]+=*$/;

function readEndpoint(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text.startsWith("https://") || text.length > ENDPOINT_MAX_LENGTH || !URL.canParse(text)) {
    throw new DomainError("invalid", 400, `Endereço de inscrição inválido: esperado https:// com até ${ENDPOINT_MAX_LENGTH} caracteres.`);
  }
  return text;
}

function readKey(keys: Record<string, unknown>, name: "p256dh" | "auth"): string {
  const value = keys[name];
  if (typeof value !== "string" || !value || value.length > KEY_MAX_LENGTH || !BASE64URL.test(value)) {
    throw new DomainError("invalid", 400, `Chave ${name} da inscrição inválida: esperado texto base64url com até ${KEY_MAX_LENGTH} caracteres.`);
  }
  return value;
}

/**
 * Confere a inscrição que o navegador mandou (`PushSubscription.toJSON()` mais o rótulo do aparelho).
 * @example readPushSubscription({ endpoint: "https://fcm.googleapis.com/…", keys: { p256dh: "B…", auth: "x…" } })
 */
export function readPushSubscription(body: unknown): PushDeviceWrite {
  const source = readObject(body);
  if (!isRecord(source.keys)) throw new DomainError("invalid", 400, "Inscrição sem as chaves p256dh e auth.");
  const label = optionalString(source, "label");
  return {
    endpoint: readEndpoint(source.endpoint),
    p256dh: readKey(source.keys, "p256dh"),
    auth: readKey(source.keys, "auth"),
    label: label ? label.slice(0, LABEL_MAX_LENGTH) : null,
  };
}
