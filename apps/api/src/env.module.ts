import { Global, Injectable, Module } from "@nestjs/common";
import { AppEnv, loadEnv, type VapidKeys } from "./env";
import type { SentryConfig } from "./observabilidade/sentry-config";

@Injectable()
export class EnvService implements AppEnv {
  readonly databaseUrl: string;
  readonly sessionSecret: string;
  readonly cookieSecure: boolean;
  readonly attachmentDir: string;
  readonly port: number;
  readonly publicUrl: string;
  readonly mcpToken: string | null;
  readonly gestorPassword: string | null;
  readonly vapid: VapidKeys | null;
  readonly sentry: SentryConfig | null;

  constructor() {
    const env = loadEnv();
    this.databaseUrl = env.databaseUrl;
    this.sessionSecret = env.sessionSecret;
    this.cookieSecure = env.cookieSecure;
    this.attachmentDir = env.attachmentDir;
    this.port = env.port;
    this.publicUrl = env.publicUrl;
    this.mcpToken = env.mcpToken;
    this.gestorPassword = env.gestorPassword;
    this.vapid = env.vapid;
    this.sentry = env.sentry;
  }
}

@Global()
@Module({
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
