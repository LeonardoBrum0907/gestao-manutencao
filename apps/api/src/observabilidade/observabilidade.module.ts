import { Global, Module } from "@nestjs/common";
import { EnvService } from "../env.module";
import { ERROR_REPORTER, FanOutErrorReporter, type ErrorReporter } from "./application/error-reporter";
import { LogErrorReporter } from "./infra/log-error-reporter";
import { SentryErrorReporter } from "./infra/sentry";

// O log recebe sempre; o Sentry só quando o .env tem SENTRY_DSN (main.ts liga o SDK antes).
function buildErrorReporter(env: EnvService): ErrorReporter {
  const log = new LogErrorReporter((line) => console.error(line));
  if (!env.sentry) return log;
  return new FanOutErrorReporter([log, new SentryErrorReporter()]);
}

// Para onde vão os erros inesperados da API. Global porque o filtro de erros é global.
@Global()
@Module({
  providers: [{ provide: ERROR_REPORTER, inject: [EnvService], useFactory: buildErrorReporter }],
  exports: [ERROR_REPORTER],
})
export class ObservabilidadeModule {}
