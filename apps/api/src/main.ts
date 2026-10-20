import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnv } from "./env";
import { mountMcp } from "./mcp/http/mount-mcp";
import { requestLog } from "./observabilidade/http/request-log";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  // Antes do MCP para que os pedidos dele também apareçam no log.
  app.use(requestLog((line) => console.log(line)));
  mountMcp(app);
  // No SIGTERM do deploy, fecha o servidor e o relógio de lembretes e sai em menos de 1 s.
  // Sem isso o node (PID 1 do container) ignora o sinal e o Docker espera 10 s para matar.
  app.enableShutdownHooks();
  await app.listen(env.port, "0.0.0.0");
}

void bootstrap();
