import { Module } from "@nestjs/common";
import { CurrentSession } from "./application/current-session";
import { Login } from "./application/login";
import { Logout } from "./application/logout";
import { SeedGestor } from "./application/seed-gestor";
import { SessionController } from "./http/session.controller";
import { SessionGuard } from "./http/session.guard";
import { PasswordHasher } from "./infra/password.hasher";
import { SessionCache } from "./infra/session.cache";
import { SessionRepository } from "./infra/session.repository";
import { UserRepository } from "./infra/user.repository";

@Module({
  controllers: [SessionController],
  providers: [
    UserRepository,
    SessionRepository,
    SessionCache,
    PasswordHasher,
    SeedGestor,
    Login,
    Logout,
    CurrentSession,
    SessionGuard,
  ],
  exports: [SessionGuard, CurrentSession],
})
export class IdentityModule {}
