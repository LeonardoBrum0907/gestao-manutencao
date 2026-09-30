import { Body, Controller, Delete, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { EnvService } from "../../env.module";
import { clearSessionCookie, readCookie, SESSION_COOKIE, writeSessionCookie } from "../../http/cookies";
import { Public } from "../../http/public";
import { CurrentSession } from "../application/current-session";
import { Login } from "../application/login";
import { Logout } from "../application/logout";

@Controller("api/session")
export class SessionController {
  constructor(
    private readonly login: Login,
    private readonly logout: Logout,
    private readonly current: CurrentSession,
    private readonly env: EnvService,
  ) {}

  @Public()
  @Post()
  async create(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const result = await this.login.execute(body);
    response.setHeader(
      "Set-Cookie",
      writeSessionCookie(result.token, result.maxAgeSec, this.env.cookieSecure),
    );
    return result.session;
  }

  @Get()
  me(@Req() request: Request) {
    return this.current.execute(readCookie(request.headers.cookie, SESSION_COOKIE));
  }

  @Delete()
  async destroy(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.logout.execute(readCookie(request.headers.cookie, SESSION_COOKIE));
    response.setHeader("Set-Cookie", clearSessionCookie(this.env.cookieSecure));
    return { ok: true };
  }
}
