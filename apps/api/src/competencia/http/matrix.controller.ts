import { Body, Controller, Get, Param, Put } from "@nestjs/common";
import { TechnicianMatrix } from "../application/technician-matrix";

@Controller("api/technicians/:technicianId/matrix")
export class MatrixController {
  constructor(private readonly matrix: TechnicianMatrix) {}

  @Get()
  show(@Param("technicianId") technicianId: string) {
    return this.matrix.show(technicianId);
  }

  @Put("equipments")
  setEquipments(@Param("technicianId") technicianId: string, @Body() body: unknown) {
    return this.matrix.setEquipments(technicianId, body);
  }

  @Put("skills/:skillId")
  setSkill(@Param("technicianId") technicianId: string, @Param("skillId") skillId: string, @Body() body: unknown) {
    return this.matrix.setSkill(technicianId, skillId, body);
  }
}
