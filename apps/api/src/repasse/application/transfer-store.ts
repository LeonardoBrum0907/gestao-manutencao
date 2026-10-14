import type { MatrixCatalogDto, TransferCreateBody } from "@manutencao/shared";
import type { ScoreState } from "../domain/transfer-progress";
import type { TransferMember } from "../domain/transfer-rules";
import type { ScoreChange } from "../domain/transfer-timeline";

export type TransferRow = {
  id: string;
  teacherId: string;
  learnerId: string;
  equipmentIds: string[];
  status: string;
  startedAt: Date;
  closedAt: Date | null;
};

export type MemberScoreRow = ScoreState & { memberId: string; skillId: string };
export type MemberChangeRow = ScoreChange & { memberId: string };

// Leitura e escrita do repasse atrás de uma interface, para as regras rodarem nos testes com um repositório falso.
export interface TransferStore {
  transfers(): Promise<TransferRow[]>;
  transfer(id: string): Promise<TransferRow | null>;
  create(input: TransferCreateBody): Promise<TransferRow>;
  close(id: string, at: Date): Promise<void>;
  remove(id: string): Promise<void>;
  members(ids: readonly string[]): Promise<TransferMember[]>;
  // Técnicos com situação "ativo": a base do número "técnicos ensinando".
  technicians(): Promise<TransferMember[]>;
  scores(memberIds: readonly string[]): Promise<MemberScoreRow[]>;
  matrixEquipments(memberId: string): Promise<string[]>;
  history(memberIds: readonly string[]): Promise<MemberChangeRow[]>;
  openPdiItems(memberId: string, skillIds: readonly string[]): Promise<{ id: string; skillId: string }[]>;
}

export const TRANSFER_STORE = Symbol("TRANSFER_STORE");

export interface TransferCatalog {
  load(): Promise<MatrixCatalogDto>;
}

export const TRANSFER_CATALOG = Symbol("TRANSFER_CATALOG");
