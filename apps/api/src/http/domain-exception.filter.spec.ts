import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ArgumentsHost, BadRequestException } from "@nestjs/common";
import { DomainError } from "../kernel/domain-error";
import { DomainExceptionFilter } from "./domain-exception.filter";

class FakeHttpResponse {
  statusCode = 0;
  body: unknown = null;

  status(code: number): this {
    this.statusCode = code;
    return this;
  }

  json(body: unknown): this {
    this.body = body;
    return this;
  }
}

function fakeHost(response: FakeHttpResponse): ArgumentsHost {
  const request = { method: "POST", baseUrl: "", route: { path: "/api/records" } };
  const http = { getResponse: () => response, getRequest: () => request };
  return { switchToHttp: () => http } as unknown as ArgumentsHost;
}

function answer(exception: unknown): FakeHttpResponse {
  const response = new FakeHttpResponse();
  new DomainExceptionFilter().catch(exception, fakeHost(response));
  return response;
}

describe("filtro de erros da API", () => {
  it("devolve o código e a mensagem do erro de domínio", () => {
    const response = answer(new DomainError("not_found", 404, "Registro não encontrado."));
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { code: "not_found", message: "Registro não encontrado." });
  });

  it("devolve a mensagem da HttpException do Nest com código http", () => {
    const response = answer(new BadRequestException("Data inválida."));
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.body, { code: "http", message: "Data inválida." });
  });

  it("esconde o erro inesperado atrás de um 500 genérico", () => {
    const response = answer(new TypeError("Cannot read properties of undefined"));
    assert.equal(response.statusCode, 500);
    assert.deepEqual(response.body, { code: "unexpected", message: "Erro inesperado." });
  });
});
