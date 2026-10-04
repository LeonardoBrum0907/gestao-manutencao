import { Inject, Injectable } from "@nestjs/common";
import type { MemberPerformanceDto, MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { assertScorable, rowsForYear } from "../domain/competency-catalog";
import {
  assertPerformanceEditable,
  currentYear,
  requireQuarter,
  requireScore,
  requireYear,
  summarizePerformance,
} from "../domain/performance";
import { CompetencyRepository } from "../infra/competency.repository";
import { PerformanceRepository } from "../infra/performance.repository";

function yearFrom(value: string | undefined, now: Date): number {
  if (value === undefined || value === "") return currentYear(now);
  return requireYear(Number(value));
}

@Injectable()
export class MemberPerformance {
  constructor(
    private readonly performance: PerformanceRepository,
    private readonly competencies: CompetencyRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string, year: string | undefined, now: Date = new Date()): Promise<MemberPerformanceDto> {
    await this.position(memberId);
    return this.build(memberId, yearFrom(year, now));
  }

  async setScore(memberId: string, year: string, quarter: string, competencyId: string, body: unknown): Promise<MemberPerformanceDto> {
    const [position, competency] = await Promise.all([this.position(memberId), this.competencies.find(competencyId)]);
    assertPerformanceEditable(position);
    if (!competency) throw new DomainError("invalid", 400, "Competência não encontrada.");
    const target = { year: requireYear(Number(year)), quarter: requireQuarter(Number(quarter)) };
    const score = requireScore(readObject(body).score ?? null);
    assertScorable(competency, score);
    if (score === null) await this.performance.clear(memberId, target.year, target.quarter, competency.id);
    else await this.performance.save(memberId, target.year, { quarter: target.quarter, competencyId: competency.id, score });
    return this.build(memberId, target.year);
  }

  private async build(memberId: string, year: number): Promise<MemberPerformanceDto> {
    const [entries, years, all] = await Promise.all([
      this.performance.load(memberId, year),
      this.performance.years(memberId),
      this.competencies.listOrdered(),
    ]);
    const competencies = rowsForYear(all, entries);
    const summary = summarizePerformance(entries, competencies.map((competency) => competency.id));
    return { memberId, year, competencies, entries, years, ...summary };
  }

  private async position(memberId: string): Promise<MemberPosition> {
    const position = await this.refs.memberPosition(memberId);
    if (!position) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return position;
  }
}
