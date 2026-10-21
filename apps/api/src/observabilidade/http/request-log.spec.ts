import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import express from "express";
import { requestLog } from "./request-log";

// Express de verdade, na memória: o teste confere que a rota já está no pedido quando a resposta termina.
describe("requestLog", () => {
  const lines: string[] = [];
  const app = express();
  let ticks = 0;
  app.use(requestLog((line) => lines.push(line), () => (ticks += 5)));
  app.get("/health", (_req, res) => void res.json({ status: "ok" }));
  app.get("/api/public/rp/:code/access", (_req, res) => void res.status(404).json({}));
  const server = app.listen(0);
  const base = () => `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  before(() => new Promise<void>((resolve) => server.once("listening", () => resolve())));
  after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  it("grava método, molde da rota, status e tempo, sem o código secreto", async () => {
    lines.length = 0;
    await fetch(`${base()}/api/public/rp/segredo123/access?x=1`);
    const line = JSON.parse(lines[0] ?? "{}");
    assert.equal(line.event, "http_request");
    assert.deepEqual([line.method, line.route, line.status, line.ms], ["GET", "/api/public/rp/:code/access", 404, 5]);
    assert.equal(lines[0]?.includes("segredo123"), false);
  });

  it("não grava o /health do healthcheck", async () => {
    lines.length = 0;
    await fetch(`${base()}/health`);
    assert.deepEqual(lines, []);
  });
});
