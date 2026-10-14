import type { MatrixCatalogDto, TransferCreateBody } from "@manutencao/shared";
import type { TransferMember } from "../domain/transfer-rules";
import type { MemberChangeRow, MemberScoreRow, TransferCatalog, TransferRow, TransferStore } from "./transfer-store";

/** Repositório em memória para os testes do repasse. */
export class FakeTransferStore implements TransferStore {
  rows: TransferRow[] = [];
  people: TransferMember[] = [];
  scoreRows: MemberScoreRow[] = [];
  changeRows: MemberChangeRow[] = [];
  equipmentsByMember = new Map<string, string[]>();
  pdiItems: { id: string; memberId: string; skillId: string }[] = [];
  private nextId = 1;

  async transfers(): Promise<TransferRow[]> {
    return [...this.rows];
  }

  async transfer(id: string): Promise<TransferRow | null> {
    return this.rows.find((row) => row.id === id) ?? null;
  }

  async create(input: TransferCreateBody): Promise<TransferRow> {
    const row = { id: `t${this.nextId++}`, ...input, status: "active", startedAt: new Date("2026-10-12T12:00:00Z"), closedAt: null };
    this.rows.push(row);
    return row;
  }

  async close(id: string, at: Date): Promise<void> {
    this.rows = this.rows.map((row) => (row.id === id ? { ...row, status: "closed", closedAt: at } : row));
  }

  async remove(id: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.id !== id);
  }

  async members(ids: readonly string[]): Promise<TransferMember[]> {
    return this.people.filter((member) => ids.includes(member.id));
  }

  async technicians(): Promise<TransferMember[]> {
    return this.people.filter((member) => member.position === "technician" && member.status === "active");
  }

  async scores(memberIds: readonly string[]): Promise<MemberScoreRow[]> {
    return this.scoreRows.filter((row) => memberIds.includes(row.memberId));
  }

  async matrixEquipments(memberId: string): Promise<string[]> {
    return this.equipmentsByMember.get(memberId) ?? [];
  }

  async history(memberIds: readonly string[]): Promise<MemberChangeRow[]> {
    return this.changeRows.filter((row) => memberIds.includes(row.memberId));
  }

  async openPdiItems(memberId: string, skillIds: readonly string[]): Promise<{ id: string; skillId: string }[]> {
    return this.pdiItems.filter((item) => item.memberId === memberId && skillIds.includes(item.skillId));
  }
}

/** Catálogo fixo para os testes do repasse. */
export class FakeTransferCatalog implements TransferCatalog {
  constructor(private readonly catalog: MatrixCatalogDto) {}

  async load(): Promise<MatrixCatalogDto> {
    return this.catalog;
  }
}
