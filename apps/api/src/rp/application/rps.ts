import { Inject, Injectable } from "@nestjs/common";
import type { RpDraftDto, RpDto, RpDuplicateDto, RpMemberSummaryDto, RpPageDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { PROBLEM_LOG, type ProblemLogPort } from "../../ports/problem-log";
import { mirrorProblem } from "../domain/rp";
import { matchMachine, matchMembers } from "../domain/rp-match";
import { parseRpText as readReports, type ParsedRp } from "../domain/rp-text";
import { RpRepository, type RpWrite } from "../infra/rp.repository";
import { parseRp, parseRpText, type RpInput } from "./parse-rp";
import { parseRpList, type RpListQuery } from "./parse-rp-list";

const MEMBER_SUMMARY_LIMIT = 20;

@Injectable()
export class Rps {
  constructor(
    private readonly rps: RpRepository,
    @Inject(PROBLEM_LOG) private readonly problems: ProblemLogPort,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  // Lê o texto colado e já sugere máquina, fábrica e técnicos do cadastro. Não grava nada.
  async parse(body: unknown): Promise<RpDraftDto[]> {
    const text = parseRpText(body);
    const reports = readReports(text);
    const [members, machines] = await Promise.all([this.refs.memberDirectory(), this.refs.machineDirectory()]);
    return reports.map((report) => {
      const machine = matchMachine(report.line, report.tag, machines);
      const match = matchMembers(report.technicians, members);
      const warnings = [...report.warnings];
      if (match.unmatched.length) warnings.push(`Técnico não encontrado no cadastro: ${match.unmatched.join(", ")}.`);
      if (!machine) warnings.push("Máquina não encontrada no cadastro: ficou só com a linha e a TAG do texto. Escolha a fábrica antes de salvar.");
      return draft(report, machine?.id ?? null, machine?.factoryId ?? null, match.memberIds, match.unmatched, warnings);
    });
  }

  async create(body: unknown): Promise<RpDto> {
    const input = parseRp(body);
    await this.assertRefs(input);
    const problem = await this.problems.save(mirrorProblem(input.fields, input.occurredAt));
    try {
      return await this.rps.insert(this.write(input, problem.id));
    } catch (error) {
      await this.problems.remove(problem.id);
      throw error;
    }
  }

  async update(id: string, body: unknown): Promise<RpDto> {
    const current = await this.get(id);
    const input = parseRp(body);
    await this.assertRefs(input);
    let problemId = current.problemRecordId;
    if (problemId) {
      await this.problems.replace(problemId, () => mirrorProblem(input.fields, input.occurredAt));
    } else {
      problemId = (await this.problems.save(mirrorProblem(input.fields, input.occurredAt))).id;
    }
    return this.rps.update(id, this.write(input, problemId));
  }

  async remove(id: string): Promise<void> {
    const current = await this.get(id);
    await this.rps.remove(id);
    if (current.problemRecordId) await this.problems.remove(current.problemRecordId);
  }

  async get(id: string): Promise<RpDto> {
    const rp = await this.rps.find(id);
    if (!rp) throw new DomainError("not_found", 404, "RP não encontrado.");
    return rp;
  }

  // O Problema espelho aponta de volta para a ficha do RP.
  async byProblem(recordId: string): Promise<{ id: string }> {
    const id = await this.rps.idByProblem(recordId);
    if (!id) throw new DomainError("not_found", 404, "RP não encontrado.");
    return { id };
  }

  page(query: RpListQuery): Promise<RpPageDto> {
    return this.rps.listPage(parseRpList(query));
  }

  // Avisa de RP parecido antes de salvar. Não bloqueia: o gestor decide.
  checkDuplicate(body: unknown): Promise<RpDuplicateDto[]> {
    const source = body as { excludeId?: unknown } | null;
    const excludeId = source && typeof source.excludeId === "string" ? source.excludeId : null;
    const input = parseRp(body);
    return this.rps.duplicates(input.fields, input.occurredAt, excludeId);
  }

  async memberSummary(memberId: string): Promise<RpMemberSummaryDto> {
    if (!(await this.refs.memberExists(memberId))) {
      throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    }
    return this.rps.memberSummary(memberId, MEMBER_SUMMARY_LIMIT);
  }

  private write(input: RpInput, problemRecordId: string): RpWrite {
    return { fields: input.fields, occurredAt: input.occurredAt, rawText: input.rawText, problemRecordId };
  }

  private async assertRefs(input: RpInput): Promise<void> {
    const { fields } = input;
    if (!(await this.refs.factoryExists(fields.factoryId))) {
      throw new DomainError("factory", 400, "Fábrica não encontrada.");
    }
    if (fields.machineId && !(await this.refs.machineExists(fields.machineId))) {
      throw new DomainError("machine", 400, "Máquina não encontrada.");
    }
    if (!(await this.refs.membersExist(fields.memberIds))) {
      throw new DomainError("member", 400, "Colaborador não encontrado.");
    }
  }
}

function draft(
  report: ParsedRp,
  machineId: string | null,
  factoryId: string | null,
  memberIds: string[],
  unmatched: string[],
  warnings: string[],
): RpDraftDto {
  return {
    occurredAt: report.date,
    orderNumber: report.orderNumber,
    factoryId,
    machineId,
    line: report.line,
    tag: report.tag,
    problem: report.problem,
    description: report.description,
    repeatedFailure: report.repeatedFailure,
    repeatedTimes: report.repeatedTimes,
    repeatedPeriod: report.repeatedPeriod,
    causes: report.causes,
    rootCause: report.rootCause,
    corrective: report.corrective,
    preventive: report.preventive,
    status: report.status,
    basicConditionImpact: report.basicConditionImpact,
    memberIds,
    unmatchedTechnicians: unmatched.length ? unmatched.join(", ") : null,
    rawText: report.rawText,
    warnings,
  };
}
