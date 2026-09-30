import { Controller, Get } from "@nestjs/common";
import { Public } from "../http/public";

@Controller()
export class HealthController {
  @Public()
  @Get("health")
  show() {
    return { status: "ok" };
  }
}
