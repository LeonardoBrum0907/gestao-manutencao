import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { loadEnv } from "./env";
import { mountMcp } from "./mcp/http/mount-mcp";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  mountMcp(app);
  await app.listen(env.port, "0.0.0.0");
}

void bootstrap();
