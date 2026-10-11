import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { McpOAuthProvider } from "./application/mcp-oauth.provider";
import { McpUseCases } from "./application/mcp-use-cases";
import { McpOAuthRepository } from "./infra/mcp-oauth.repository";

@Module({
  imports: [IdentityModule],
  providers: [McpOAuthRepository, McpOAuthProvider, McpUseCases],
})
export class McpModule {}
