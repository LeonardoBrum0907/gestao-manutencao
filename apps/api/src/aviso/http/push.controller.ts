import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { PushDevices } from "../application/push-devices";

// Rotas novas de Configurações › Avisos. Ficam atrás do login como as demais (SessionGuard global).
@Controller("api/push")
export class PushController {
  constructor(private readonly devices: PushDevices) {}

  @Get("config")
  config() {
    return this.devices.config();
  }

  @Post("devices")
  subscribe(@Body() body: unknown) {
    return this.devices.subscribe(body);
  }

  @Delete("devices/:id")
  async remove(@Param("id") id: string) {
    await this.devices.remove(id);
    return { ok: true };
  }

  @Post("test")
  @HttpCode(200)
  test() {
    return this.devices.sendTest(new Date());
  }
}
