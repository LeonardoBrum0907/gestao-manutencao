import type { NextFunction, Request, Response } from "express";
import { writeJsonLog, type LogSink } from "../infra/json-log";
import { routeLabel } from "./route-label";

// O healthcheck do Docker chama /health a cada 5 s: logar isso enterraria o resto.
const QUIET_PATHS = new Set(["/health"]);

/**
 * Middleware do Express que grava uma linha `http_request` por pedido: método, rota, status e tempo.
 * Não grava corpo, consulta nem cookies.
 * @example app.use(requestLog(console.log))
 */
export function requestLog(sink: LogSink, clock: () => number = () => performance.now()) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const started = clock();
    response.on("finish", () => {
      if (QUIET_PATHS.has(request.path)) return;
      const ms = Math.round(clock() - started);
      writeJsonLog(sink, "http_request", { method: request.method, route: routeLabel(request), status: response.statusCode, ms });
    });
    next();
  };
}
