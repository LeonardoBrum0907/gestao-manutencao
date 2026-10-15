import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PushDeviceDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import type { PushDeviceWrite } from "../domain/push-subscription";
import type { PushDeviceStore, PushOutcome, PushSenderPort, PushTarget } from "./push-ports";
import { PushDevices } from "./push-devices";

type StoredDevice = PushDeviceDto & PushTarget;

class FakePushDeviceStore implements PushDeviceStore {
  rows: StoredDevice[] = [];

  async list(): Promise<StoredDevice[]> {
    return [...this.rows];
  }

  async upsert(write: PushDeviceWrite): Promise<PushDeviceDto> {
    const current = this.rows.find((row) => row.endpoint === write.endpoint);
    const row: StoredDevice = { id: current?.id ?? `d${this.rows.length + 1}`, createdAt: "2026-10-14T00:00:00.000Z", lastSentAt: null, ...write };
    this.rows = [...this.rows.filter((item) => item.endpoint !== write.endpoint), row];
    return row;
  }

  async remove(id: string): Promise<boolean> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.id !== id);
    return this.rows.length < before;
  }

  async markSent(ids: string[], at: Date): Promise<void> {
    this.rows = this.rows.map((row) => (ids.includes(row.id) ? { ...row, lastSentAt: at.toISOString() } : row));
  }
}

class FakePushSender implements PushSenderPort {
  sent: Array<{ endpoint: string; payload: string }> = [];
  constructor(
    readonly publicKey: string | null,
    private readonly outcomes: Record<string, PushOutcome> = {},
  ) {}

  async send(target: PushTarget, payload: string): Promise<PushOutcome> {
    this.sent.push({ endpoint: target.endpoint, payload });
    return this.outcomes[target.endpoint] ?? "sent";
  }
}

const subscription = (name: string) => ({ endpoint: `https://push.exemplo/${name}`, keys: { p256dh: "BKey", auth: "auth" }, label: name });
const NOW = new Date("2026-10-14T23:50:00Z");

async function setup(sender: FakePushSender) {
  const store = new FakePushDeviceStore();
  const devices = new PushDevices(store, sender);
  await devices.subscribe(subscription("celular"));
  await devices.subscribe(subscription("velho"));
  return { store, devices };
}

describe("PushDevices", () => {
  it("devolve a chave pública e os aparelhos sem as chaves da inscrição", async () => {
    const { devices } = await setup(new FakePushSender("BPUB"));
    const config = await devices.config();
    assert.equal(config.publicKey, "BPUB");
    assert.deepEqual(config.devices.map((device) => Object.keys(device).sort()), [
      ["createdAt", "endpoint", "id", "label", "lastSentAt"],
      ["createdAt", "endpoint", "id", "label", "lastSentAt"],
    ]);
  });

  it("inscrever o mesmo endereço de novo não duplica", async () => {
    const { store, devices } = await setup(new FakePushSender("BPUB"));
    await devices.subscribe(subscription("celular"));
    assert.equal(store.rows.length, 2);
  });

  it("sem chaves no servidor, recusa inscrever e enviar com 503", async () => {
    const devices = new PushDevices(new FakePushDeviceStore(), new FakePushSender(null));
    const keysError = (error: unknown) => error instanceof DomainError && error.statusCode === 503 && error.message.includes("VAPID_PUBLIC_KEY");
    await assert.rejects(devices.subscribe(subscription("celular")), keysError);
    await assert.rejects(devices.sendTest(NOW), keysError);
  });

  it("o teste vai para todos, apaga inscrição que acabou e marca quem recebeu", async () => {
    const sender = new FakePushSender("BPUB", { "https://push.exemplo/velho": "gone" });
    const { store, devices } = await setup(sender);
    assert.deepEqual(await devices.sendTest(NOW), { sent: 1, removed: 1, failed: 0 });
    assert.equal(sender.sent.length, 2);
    assert.equal(JSON.parse(sender.sent[0]?.payload ?? "{}").title, "Aviso de teste");
    assert.deepEqual(store.rows.map((row) => [row.label, row.lastSentAt]), [["celular", NOW.toISOString()]]);
  });

  it("falha de envio conta como falha e mantém o aparelho", async () => {
    const { store, devices } = await setup(new FakePushSender("BPUB", { "https://push.exemplo/celular": "failed" }));
    assert.deepEqual(await devices.sendTest(NOW), { sent: 1, removed: 0, failed: 1 });
    assert.equal(store.rows.length, 2);
  });

  it("remover aparelho que não existe dá 404 com o id", async () => {
    const devices = new PushDevices(new FakePushDeviceStore(), new FakePushSender("BPUB"));
    await assert.rejects(devices.remove("d9"), (error: unknown) => error instanceof DomainError && error.statusCode === 404 && error.message.includes("d9"));
  });
});
