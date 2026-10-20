import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { DatabaseProbe } from "../application/database-probe";

// O healthcheck do Docker desiste em 5 s. Um banco travado (não recusando, só sem responder)
// faria o Prisma esperar o pool por 10 s; aqui a resposta vem antes disso.
const PROBE_TIMEOUT_MS = 3000;

function rejectAfter(ms: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Banco sem resposta em ${ms} ms.`)), ms).unref();
  });
}

/** Faz um `SELECT 1` no Postgres com prazo curto. */
@Injectable()
export class PrismaDatabaseProbe implements DatabaseProbe {
  constructor(private readonly prisma: PrismaService) {}

  async isReachable(): Promise<boolean> {
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, rejectAfter(PROBE_TIMEOUT_MS)]);
      return true;
    } catch {
      return false;
    }
  }
}
