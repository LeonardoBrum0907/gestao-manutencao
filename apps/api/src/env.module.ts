import { Global, Injectable, Module } from "@nestjs/common";
import { AppEnv, loadEnv, type VapidKeys } from "./env";

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
  }
}

@Global()
@Module({
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}
