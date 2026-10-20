import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HOME_PATH, loginReturnPath, loginReturnState } from "./login-return";

// Regressão: link aberto sem sessão (aviso do celular, link no PC) caía no Meu Dia depois do login.
describe("volta do login", () => {
  it("devolve a tela pedida com os filtros", () => {
    const state = loginReturnState({ pathname: "/maquinas", search: "?status=stopped" });
    assert.equal(loginReturnPath(state), "/maquinas?status=stopped");
    assert.equal(loginReturnPath({ from: "/registros/r1" }), "/registros/r1");
  });

  it("sem tela pedida vai para o Meu Dia", () => {
    assert.equal(loginReturnPath(null), HOME_PATH);
    assert.equal(loginReturnPath(undefined), HOME_PATH);
    assert.equal(loginReturnPath({ menu: true }), HOME_PATH);
    assert.equal(loginReturnPath({ from: "/" }), HOME_PATH);
  });

  it("recusa o que não é tela deste app", () => {
    assert.equal(loginReturnPath({ from: "//outro-site.com" }), HOME_PATH);
    assert.equal(loginReturnPath({ from: "https://outro-site.com" }), HOME_PATH);
    assert.equal(loginReturnPath({ from: "/login" }), HOME_PATH);
    assert.equal(loginReturnPath({ from: 42 }), HOME_PATH);
  });
});
