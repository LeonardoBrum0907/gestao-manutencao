import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publicRpManifest } from "./public-rp-manifest";

const CODE = "k8F3qP0zLm2xV7sR9tW1yB4n";

describe("publicRpManifest", () => {
  it("abre o app instalado direto no link, e não no início do app do coordenador", () => {
    const manifest = publicRpManifest(CODE, { role: "team" });
    assert.equal(manifest.start_url, `/rp/abrir/${CODE}`);
    assert.equal(manifest.scope, `/rp/abrir/${CODE}`);
    assert.equal(manifest.id, `/rp/abrir/${CODE}`);
    assert.equal(manifest.name, "RPs da equipe");
  });

  it("o link do supervisor vira um app com o nome dele", () => {
    const manifest = publicRpManifest(CODE, { role: "supervisor", supervisorName: "Carlos" });
    assert.equal(manifest.name, "RPs · Carlos");
    assert.equal(manifest.short_name, "RPs");
  });
});
