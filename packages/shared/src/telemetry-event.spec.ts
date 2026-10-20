import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scrubTelemetryBreadcrumb, scrubTelemetryEvent } from "./telemetry-event";

describe("scrubTelemetryEvent", () => {
  it("deixa do pedido só o método e a URL limpa", () => {
    const event = scrubTelemetryEvent({
      request: { method: "POST", url: "https://app/api/public/rp/k8F3x?y=1", data: "{}", cookies: { s: "1" }, headers: { cookie: "s=1" }, query_string: "y=1" },
    });
    assert.deepEqual(event.request, { method: "POST", url: "https://app/api/public/rp/:code" });
  });

  it("tira o usuário e limpa os rastros", () => {
    const event = scrubTelemetryEvent({ user: { ip_address: "1.2.3.4" }, breadcrumbs: [{ data: { from: "/rp/abrir/a", to: "/agenda?d=1" } }] });
    assert.equal("user" in event, false);
    assert.deepEqual(event.breadcrumbs, [{ data: { from: "/rp/abrir/:code", to: "/agenda" } }]);
  });

  it("aceita evento sem pedido nem rastro", () => {
    assert.deepEqual(scrubTelemetryEvent({}), {});
  });
});

describe("scrubTelemetryBreadcrumb", () => {
  it("limpa a mensagem e a url do fetch, e deixa o resto", () => {
    const crumb = scrubTelemetryBreadcrumb({ message: "GET /rp/abrir/zz", data: { url: "/api/public/rp/zz/access", status_code: 404 } });
    assert.deepEqual(crumb, { message: "GET /rp/abrir/:code", data: { url: "/api/public/rp/:code/access", status_code: 404 } });
  });
});
