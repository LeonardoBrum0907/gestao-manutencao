import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { routeLabel } from "./route-label";

describe("routeLabel", () => {
  it("usa o molde da rota para agrupar os pedidos", () => {
    const request = { baseUrl: "", originalUrl: "/api/records/7?x=1", route: { path: "/api/records/:id" } };
    assert.equal(routeLabel(request), "/api/records/:id");
  });

  it("junta o prefixo do roteador montado, como o /mcp", () => {
    assert.equal(routeLabel({ baseUrl: "/mcp", originalUrl: "/mcp", route: { path: "/" } }), "/mcp/");
  });

  it("sem rota, usa o caminho limpo e cortado", () => {
    assert.equal(routeLabel({ baseUrl: "", originalUrl: "/rp/abrir/k8F3x?de=zap" }), "/rp/abrir/:code");
    assert.equal(routeLabel({ baseUrl: "", originalUrl: `/${"a".repeat(300)}` }).length, 120);
  });
});
