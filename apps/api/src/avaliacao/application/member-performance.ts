import { Inject, Injectable } from "@nestjs/common";
import type { MemberPerformanceDto, MemberPosition } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { readObject } from "../../kernel/parse";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import {
  assertPerformanceEditable,
  currentYear,
  requireCompetency,
  requireQuarter,
  requireScore,
  requireYear,
  summarizePerformance,
} from "../domain/performance";
import { PerformanceRepository } from "../infra/performance.repository";

function yearFrom(value: string | undefined, now: Date): number {
  if (value === undefined || value === "") return currentYear(now);
  return requireYear(Number(value));
}

@Injectable()
export class MemberPerformance {
  constructor(
    private readonly performance: PerformanceRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async show(memberId: string, year: string | undefined, now: Date = new Date()): Promise<MemberPerformanceDto> {
    await this.position(memberId);
    return this.build(memberId, yearFrom(year, now));
  }

  async setScore(memberId: string, year: string, quarter: string, competency: string, body: unknown): Promise<MemberPerformanceDto> {
    assertPerformanceEditable(await this.position(memberId));
    const target = {
      year: requireYear(Number(year)),
      quarter: requireQuarter(Number(quarter)),
      competency: requireCompetency(competency),
    };
    const score = requireScore(readObject(body).score ?? null);
    if (score === null) await this.performance.clear(memberId, target.year, target.quarter, target.competency);
    else await this.performance.save(memberId, target.year, { quarter: target.quarter, competency: target.competency, score });
    return this.build(memberId, target.year);
  }

  private async build(memberId: string, year: number): Promise<MemberPerformanceDto> {
    const [entries, years] = await Promise.all([this.performance.load(memberId, year), this.performance.years(memberId)]);
    return { memberId, year, entries, years, ...summarizePerformance(entries) };
  }

  private async position(memberId: string): Promise<MemberPosition> {
    const position = await this.refs.memberPosition(memberId);
    if (!position) throw new DomainError("not_found", 404, "Colaborador não encontrado.");
    return position;
  }
}
