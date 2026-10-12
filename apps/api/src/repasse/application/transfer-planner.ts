import { Inject, Injectable } from "@nestjs/common";
import type { MatrixCatalogDto, TransferCandidateDto, TransferSuggestionDto, TransferSummaryDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { masteredSkills, progressOf, type ScoreBook } from "../domain/transfer-progress";
import { assertNewTransfer, focusEquipments, rankCandidates, requireTechnician } from "../domain/transfer-rules";
import { parseTransferCreate } from "./parse-transfer";
import { booksByMember, summaryOf } from "./transfer-summary";
import { TRANSFER_CATALOG, TRANSFER_STORE, type TransferCatalog, type TransferRow, type TransferStore } from "./transfer-store";

const EMPTY_BOOK: ScoreBook = new Map();

/** Abrir, sugerir, encerrar e excluir repasses. */
@Injectable()
export class TransferPlanner {
  constructor(
    @Inject(TRANSFER_STORE) private readonly store: TransferStore,
    @Inject(TRANSFER_CATALOG) private readonly catalog: TransferCatalog,
  ) {}

  // Quem aprende melhor com quem ensina: todos os técnicos ativos, medidos contra o que ele domina.
  async suggestions(teacherId: string, requested: readonly string[]): Promise<TransferSuggestionDto> {
    if (!teacherId) throw new DomainError("invalid", 400, "Informe quem ensina (teacherId).");
    const teacher = requireTechnician((await this.store.members([teacherId]))[0] ?? null, teacherId);
    const [catalog, teacherEquipments, technicians, transfers] = await Promise.all([
      this.catalog.load(),
      this.store.matrixEquipments(teacherId),
      this.store.technicians(),
      this.store.transfers(),
    ]);
    const equipmentIds = focusEquipments(requested, teacherEquipments, teacher.name);
    const books = booksByMember(await this.store.scores([teacherId, ...technicians.map((member) => member.id)]));
    const mastered = masteredSkills(catalog, equipmentIds, books.get(teacherId) ?? EMPTY_BOOK);
    const learningFrom = await this.learningFrom(transfers);
    const candidates: TransferCandidateDto[] = technicians
      .filter((member) => member.id !== teacherId)
      .map((member) => ({ member: { id: member.id, name: member.name, teamName: member.teamName }, progress: progressOf(mastered, books.get(member.id) ?? EMPTY_BOOK), learningFrom: learningFrom.get(member.id) ?? null }));
    return { teacherId, teacherEquipments: equipmentOptions(catalog, teacherEquipments), equipmentIds, mastered: mastered.length, candidates: rankCandidates(candidates) };
  }

  async create(body: unknown, now = new Date()): Promise<TransferSummaryDto> {
    const input = parseTransferCreate(body);
    const [members, teacherEquipments, transfers, catalog] = await Promise.all([
      this.store.members([input.teacherId, input.learnerId]),
      this.store.matrixEquipments(input.teacherId),
      this.store.transfers(),
      this.catalog.load(),
    ]);
    const teacher = requireTechnician(members.find((member) => member.id === input.teacherId) ?? null, input.teacherId);
    const learner = requireTechnician(members.find((member) => member.id === input.learnerId) ?? null, input.learnerId);
    const equipmentIds = focusEquipments(input.equipmentIds, teacherEquipments, teacher.name);
    const books = booksByMember(await this.store.scores([teacher.id, learner.id]));
    const mastered = masteredSkills(catalog, equipmentIds, books.get(teacher.id) ?? EMPTY_BOOK);
    const learnerTeacherName = (await this.learningFrom(transfers)).get(learner.id) ?? null;
    assertNewTransfer({ teacher, learner, learnerTeacherName, mastered: mastered.length });
    const row = await this.store.create({ teacherId: teacher.id, learnerId: learner.id, equipmentIds });
    const people = new Map(members.map((member) => [member.id, member]));
    return summaryOf(row, { catalog, people, books, history: new Map(), now });
  }

  async close(id: string, now = new Date()): Promise<void> {
    const row = await this.store.transfer(id);
    if (!row) throw new DomainError("not_found", 404, `Repasse "${id}" não encontrado.`);
    if (row.status === "closed") return;
    await this.store.close(id, now);
  }

  async remove(id: string): Promise<void> {
    if (!(await this.store.transfer(id))) throw new DomainError("not_found", 404, `Repasse "${id}" não encontrado.`);
    await this.store.remove(id);
  }

  // Quem aprende com quem nos repasses em andamento: id de quem aprende → nome de quem ensina.
  private async learningFrom(transfers: readonly TransferRow[]): Promise<Map<string, string>> {
    const active = transfers.filter((row) => row.status === "active");
    const teachers = await this.store.members([...new Set(active.map((row) => row.teacherId))]);
    const names = new Map(teachers.map((member) => [member.id, member.name]));
    return new Map(active.map((row) => [row.learnerId, names.get(row.teacherId) ?? "outro técnico"]));
  }
}

function equipmentOptions(catalog: MatrixCatalogDto, ids: readonly string[]): { id: string; name: string }[] {
  return catalog.equipments.filter((item) => !item.archived && ids.includes(item.id)).map((item) => ({ id: item.id, name: item.name }));
}
