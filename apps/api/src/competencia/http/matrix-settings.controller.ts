import { Body, Controller, Get, Put } from "@nestjs/common";
import { MatrixSettings } from "../application/matrix-settings";

@Controller("api/matrix-settings")
export class MatrixSettingsController {
  constructor(private readonly settings: MatrixSettings) {}

  @Get()
  show() {
    return this.settings.show();
  }

  @Put()
  update(@Body() body: unknown) {
    return this.settings.update(body);
  }
}
