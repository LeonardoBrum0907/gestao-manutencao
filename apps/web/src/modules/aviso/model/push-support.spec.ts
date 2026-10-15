import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applicationServerKey, deviceLabel, lastSentText, pushSupport, type PushEnvironment } from "./push-support";

const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36";
const IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const WINDOWS_EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0";

const androidReady: PushEnvironment = { hasServiceWorker: true, hasPushManager: true, permission: "default", standalone: false, userAgent: ANDROID_CHROME };

describe("avisos: o aparelho pode receber?", () => {
  it("Android com Chrome pode, mesmo no navegador", () => {
    assert.equal(pushSupport(androidReady), "ready");
  });

  it("iPhone fora do app instalado pede para instalar primeiro", () => {
    assert.equal(pushSupport({ ...androidReady, userAgent: IPHONE_SAFARI, hasPushManager: false }), "install-first");
    assert.equal(pushSupport({ ...androidReady, userAgent: IPHONE_SAFARI, standalone: true }), "ready");
  });

  it("sem service worker, PushManager ou Notification não dá", () => {
    assert.equal(pushSupport({ ...androidReady, hasServiceWorker: false }), "unsupported");
    assert.equal(pushSupport({ ...androidReady, hasPushManager: false }), "unsupported");
    assert.equal(pushSupport({ ...androidReady, permission: "missing" }), "unsupported");
  });

  it("permissão negada fica bloqueada; concedida segue pronta", () => {
    assert.equal(pushSupport({ ...androidReady, permission: "denied" }), "blocked");
    assert.equal(pushSupport({ ...androidReady, permission: "granted" }), "ready");
  });
});

describe("avisos: chave pública", () => {
  it("decodifica base64url sem preenchimento", () => {
    assert.deepEqual([...applicationServerKey("AQID")], [1, 2, 3]);
    assert.deepEqual([...applicationServerKey("-_8")], [251, 255]);
  });

  it("recusa texto fora do formato e diz o esperado", () => {
    assert.throws(() => applicationServerKey("abc=="), /base64url/);
  });
});

describe("avisos: nome do aparelho e último envio", () => {
  it("junta sistema e navegador", () => {
    assert.equal(deviceLabel(ANDROID_CHROME), "Android · Chrome");
    assert.equal(deviceLabel(IPHONE_SAFARI), "iPhone · Safari");
    assert.equal(deviceLabel(WINDOWS_EDGE), "Windows · Edge");
    assert.equal(deviceLabel(""), "Aparelho sem nome");
  });

  it("mostra o último aviso no horário de Brasília", () => {
    assert.equal(lastSentText(null), "Ainda não recebeu aviso");
    assert.equal(lastSentText("2026-10-15T00:30:00.000Z"), "Último aviso em 14/10, 21:30");
  });
});
