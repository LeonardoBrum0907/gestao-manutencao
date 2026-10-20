import { Global, Module } from "@nestjs/common";
import { ERROR_REPORTER, type ErrorReporter } from "./application/error-reporter";
import { LogErrorReporter } from "./infra/log-error-reporter";

function buildErrorReporter(): ErrorReporter {
  return new LogErrorReporter((line) => console.error(line));
}

// Para onde vão os erros inesperados da API. Global porque o filtro de erros é global.
@Global()
@Module({
  providers: [{ provide: ERROR_REPORTER, useFactory: buildErrorReporter }],
  exports: [ERROR_REPORTER],
})
export class ObservabilidadeModule {}
