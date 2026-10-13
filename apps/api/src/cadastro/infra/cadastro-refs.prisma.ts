import { Injectable } from "@nestjs/common";
import { isMemberPosition, type MemberPosition } from "@manutencao/shared";
import type { CadastroRefs } from "../../ports/cadastro-refs";
import type { MachineSpotRefs } from "../domain/hierarchy";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrismaCadastroRefs implements CadastroRefs {
  constructor(private readonly prisma: PrismaService) {}

  async factoryExists(id: string): Promise<boolean> {
    const row = await this.prisma.factory.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async lineExists(id: string): Promise<boolean> {
    const row = await this.prisma.line.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async memberExists(id: string): Promise<boolean> {
    const row = await this.prisma.member.findUnique({ where: { id }, select: { id: true } });
    return Boolean(row);
  }

  async linesExist(ids: string[]): Promise<boolean> {
    const unique = [...new Set(ids)];
    if (!unique.length) return true;
    return (await this.prisma.line.count({ where: { id: { in: unique } } })) === unique.length;
  }

  async membersExist(ids: string[]): Promise<boolean> {
    const unique = [...new Set(ids)];
    if (!unique.length) return true;
    return (await this.prisma.member.count({ where: { id: { in: unique } } })) === unique.length;
  }

  async memberPosition(id: string): Promise<MemberPosition | null> {
    const row = await this.prisma.member.findUnique({ where: { id }, select: { position: true } });
    return row && isMemberPosition(row.position) ? row.position : null;
  }

  async machineSpot(machineId: string | null, subassemblyId: string | null): Promise<MachineSpotRefs> {
    const [machine, subassembly] = await Promise.all([
      machineId
        ? this.prisma.machine.findUnique({
            where: { id: machineId },
            select: { id: true, lineId: true, equipmentId: true, hiddenSubassemblies: { select: { subassemblyId: true } } },
          })
        : null,
      subassemblyId
        ? this.prisma.subassembly.findUnique({
            where: { id: subassemblyId },
            select: { id: true, equipmentId: true, machineId: true, archived: true },
          })
        : null,
    ]);
    if (!machine) return { machine: null, subassembly };
    const { hiddenSubassemblies, ...rest } = machine;
    return { machine: { ...rest, hiddenSubassemblyIds: hiddenSubassemblies.map((item) => item.subassemblyId) }, subassembly };
  }

  async memberDirectory() {
    const rows = await this.prisma.member.findMany({ select: { id: true, name: true, status: true } });
    return rows.map((row) => ({ id: row.id, name: row.name, active: row.status === "active" }));
  }

  async lineDirectory() {
    return this.prisma.line.findMany({ select: { id: true, name: true, internalCode: true, factoryId: true } });
  }
}
