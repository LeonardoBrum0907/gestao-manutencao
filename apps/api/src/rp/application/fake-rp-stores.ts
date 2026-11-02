import type { MemberPosition, RecordDto, RpDto, RpDuplicateDto, RpListItemDto, RpPageDto, RpSource } from "@manutencao/shared";
import type { MachineSpotRefs } from "../../cadastro/domain/hierarchy";
import type { CadastroRefs } from "../../ports/cadastro-refs";
import type { ProblemLogPort, ProblemWrite } from "../../ports/problem-log";
import type { RpDecisionPatch } from "../domain/rp-decision";
import type { RpStore, RpWrite } from "./rp-store";

// Classes falsas dos testes de Rps: guardam tudo em memória.

const STAMP = "2026-10-20T12:00:00.000Z";

function rpOf(id: string, write: RpWrite, chamadoId: string | null, source: RpSource): RpDto {
  const { fields } = write;
  return {
    ...fields,
    id,
    occurredAt: write.occurredAt.toISOString(),
    problemRecordId: write.problemRecordId,
    chamadoId,
    rawText: write.rawText,
    source,
    checkedAt: null,
    reviewRequest: null,
    reviewRequestedAt: null,
    rejectedAt: null,
    rejectionNote: null,
    createdAt: STAMP,
    updatedAt: STAMP,
  };
}

export class FakeRpStore implements RpStore {
  rows: RpDto[] = [];
  private next = 1;

  async find(id: string): Promise<RpDto | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async chamadoFree(chamadoId: string): Promise<"missing" | "taken" | "free"> {
    return this.rows.some((row) => row.chamadoId === chamadoId) ? "taken" : "free";
  }

  async idByProblem(problemRecordId: string): Promise<string | null> {
    return this.rows.find((row) => row.problemRecordId === problemRecordId)?.id ?? null;
  }

  async insert(write: RpWrite, chamadoId: string | null = null, origin: RpSource = "paste"): Promise<RpDto> {
    const row = rpOf(`rp${this.next++}`, write, chamadoId, origin);
    this.rows.push(row);
    return row;
  }

  async update(id: string, write: RpWrite): Promise<RpDto> {
    const current = (await this.find(id))!;
    const row = { ...rpOf(id, write, current.chamadoId, current.source), createdAt: current.createdAt };
    this.rows = this.rows.map((item) => (item.id === id ? row : item));
    return row;
  }

  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }

  async setDecision(id: string, patch: RpDecisionPatch): Promise<RpDto> {
    const row = { ...(await this.find(id))!, ...patch } as RpDto;
    this.rows = this.rows.map((item) => (item.id === id ? row : item));
    return row;
  }

  async listPage(): Promise<RpPageDto> {
    return { items: [], nextCursor: null };
  }

  async memberSummary(): Promise<{ count: number; items: RpListItemDto[] }> {
    return { count: 0, items: [] };
  }

  async duplicates(): Promise<RpDuplicateDto[]> {
    return [];
  }
}

/** Problemas de Registros gravados pelo RP: guarda o que chegou, sem regra de Registros. */
export class FakeProblemLog implements ProblemLogPort {
  saved = new Map<string, ProblemWrite>();
  private next = 1;

  async save(write: ProblemWrite): Promise<RecordDto> {
    const id = `rec${this.next++}`;
    this.saved.set(id, write);
    return { id } as RecordDto;
  }

  async replace(id: string, build: (current: RecordDto) => ProblemWrite | Promise<ProblemWrite>): Promise<RecordDto> {
    this.saved.set(id, await build({ id } as RecordDto));
    return { id } as RecordDto;
  }

  async remove(id: string): Promise<void> {
    this.saved.delete(id);
  }
}

/** Cadastro que aceita qualquer id: os testes de Rps não conferem cadastro. */
export class FakeCadastroRefs implements CadastroRefs {
  async factoryExists(): Promise<boolean> {
    return true;
  }

  async lineExists(): Promise<boolean> {
    return true;
  }

  async memberExists(): Promise<boolean> {
    return true;
  }

  async linesExist(): Promise<boolean> {
    return true;
  }

  async membersExist(): Promise<boolean> {
    return true;
  }

  async memberPosition(): Promise<MemberPosition | null> {
    return "technician";
  }

  async machineSpot(): Promise<MachineSpotRefs> {
    return { machine: null, subassembly: null };
  }

  async memberDirectory(): Promise<{ id: string; name: string; active: boolean }[]> {
    return [];
  }

  async lineDirectory(): Promise<{ id: string; name: string; internalCode: string | null; factoryId: string }[]> {
    return [];
  }
}
