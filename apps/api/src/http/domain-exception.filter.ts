import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import type { Response } from "express";
import { DomainError } from "../kernel/domain-error";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
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
    response.status(500).json({ code: "unexpected", message: "Erro inesperado." });
  }
}
