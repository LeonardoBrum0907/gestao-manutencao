import { Global, Injectable, Module } from "@nestjs/common";
import { AppEnv, loadEnv } from "./env";

@Injectable()
export class EnvService implements AppEnv {
  readonly databaseUrl: string;
  readonly sessionSecret: string;
  readonly cookieSecure: boolean;
  readonly attachmentDir: string;
  readonly port: number;

  constructor() {
    const env = loadEnv();
    this.databaseUrl = env.databaseUrl;
    this.sessionSecret = env.sessionSecret;
    this.cookieSecure = env.cookieSecure;
    this.attachmentDir = env.attachmentDir;
    this.port = env.port;
  }
}

@Global()
@Module({
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
