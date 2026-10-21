import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Inject } from "@nestjs/common";
import type { Request, Response } from "express";
import { DomainError } from "../kernel/domain-error";
import { ERROR_REPORTER, type ErrorReporter } from "../observabilidade/application/error-reporter";
import { routeLabel } from "../observabilidade/http/route-label";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(@Inject(ERROR_REPORTER) private readonly reporter: ErrorReporter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    if (exception instanceof DomainError) {
      response.status(exception.statusCode).json({
        code: exception.code,
        message: exception.message,
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : typeof body === "object" && body && "message" in body
            ? String((body as { message: unknown }).message)
            : "Não foi possível concluir.";
      response.status(status).json({ code: "http", message });
      return;
    }
    // Este filtro pega tudo e toma o lugar do filtro padrão do Nest, que era quem logava o erro.
    // Sem avisar aqui, o 500 sumia sem stack trace nenhum.
    const request = http.getRequest<Request>();
    this.reporter.report(exception, { method: request.method, route: routeLabel(request) });
    response.status(500).json({ code: "unexpected", message: "Erro inesperado." });
  }
}
