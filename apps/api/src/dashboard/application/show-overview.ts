import { Inject, Injectable } from "@nestjs/common";
import {
  FEEDBACK_SILENCE_DAYS,
  type DashboardMachinesDto,
  type DashboardNowDto,
  type DashboardOverviewDto,
  type DashboardPeopleDto,
} from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";
import { CADASTRO_REFS, type CadastroRefs } from "../../ports/cadastro-refs";
import { startOfDay } from "../../registro/domain/follow-up";
import { SettingsRepository } from "../../competencia/infra/settings.repository";
import { FLOW_WEEKS, flowByWeek } from "../domain/flow";
import { chamadoTotals, fourMOf, paretoOf, repeatsOf } from "../domain/machines";
import { evaluationOf, lastClosedQuarter, silentMembers } from "../domain/people";
import { countByWeek, periodRange, weekStarts, type PeriodRange } from "../domain/period";
import { OverviewRead, type ChamadoRow, type LineRow } from "../infra/overview-read.prisma";
import {
  chamadoFacts,
  factoryScope,
  failureFacts,
  lineInScope,
  openChamadoList,
  problemInScope,
  rpCauses,
  rpInScope,
  type FactoryScope,
} from "./overview-facts";
import { parseOverviewQuery, type OverviewFilter, type OverviewQuery } from "./parse-overview";

// Linhas em montagem: ainda não liberadas, mas não paradas.
const SETTING_UP = new Set(["implanting", "testing", "adjusting"]);

type PlantContext = { filter: OverviewFilter; scope: FactoryScope; lines: LineRow[]; lineNames: Map<string, string>; chamados: ChamadoRow[] };

/** Dashboard do coordenador: faixa Agora, entraram × concluídas, faixa Máquinas e números de pessoas. */
@Injectable()
export class ShowOverview {
  constructor(
    private readonly read: OverviewRead,
    private readonly settings: SettingsRepository,
    @Inject(CADASTRO_REFS) private readonly refs: CadastroRefs,
  ) {}

  async execute(query: OverviewQuery, now: Date = new Date()): Promise<DashboardOverviewDto> {
    const filter = parseOverviewQuery(query);
    await this.assertFactory(filter.factoryId);
    const range = periodRange(filter.days, now);
    const weeks = weekStarts(now, FLOW_WEEKS);
    const plant = await this.plant(filter, earliest(range.previousFrom, startOfDay(weeks[0])));
    const [nowBand, flow, machines, people] = await Promise.all([
      this.nowBand(plant, now),
      this.read.flow(startOfDay(weeks[0])).then((facts) => flowByWeek(facts.created, facts.completed, weeks)),
      this.machines(plant, range, weeks),
      this.people(now),
    ]);
    return { generatedAt: now.toISOString(), factoryId: filter.factoryId, now: nowBand, flow, machines, people };
  }

  private async plant(filter: OverviewFilter, since: Date): Promise<PlantContext> {
    const [lines, allChamados] = await Promise.all([this.read.lines(), this.read.chamados(since)]);
    const scope = factoryScope(lines, filter.factoryId);
    const chamados = allChamados.filter((row) => lineInScope(scope, row.lineId));
    return { filter, scope, lines, lineNames: new Map(lines.map((line) => [line.id, line.name])), chamados };
  }

  private async nowBand(plant: PlantContext, now: Date): Promise<DashboardNowDto> {
    const [tasks, drafts, rps] = await Promise.all([this.read.taskCounts(now), this.read.drafts(), this.read.rpsInAnalysis()]);
    const lines = plant.lines.filter((line) => lineInScope(plant.scope, line.id));
    const analysis = rps.filter((rp) => rpInScope(plant.scope, rp));
    return {
      openChamados: openChamadoList(plant.chamados, plant.lineNames),
      overdueTasks: tasks.overdue,
      overdueHighTasks: tasks.overdueHigh,
      dueTodayTasks: tasks.dueToday,
      stoppedLines: lines.filter((line) => line.status === "stopped").map(({ id, name }) => ({ id, name })),
      settingUpLines: lines.filter((line) => SETTING_UP.has(line.status)).length,
      drafts: drafts.count,
      oldestDraftAt: drafts.oldest?.toISOString() ?? null,
      rpsInAnalysis: analysis.length,
      rpsWithoutRootCause: analysis.filter((rp) => !rp.rootCause?.trim()).length,
    };
  }

  private async machines(plant: PlantContext, range: PeriodRange, weeks: string[]): Promise<DashboardMachinesDto> {
    const [rpRows, problemRows] = await Promise.all([this.read.rpsSince(range.from), this.read.problemsSince(range.from)]);
    const rps = rpRows.filter((rp) => rpInScope(plant.scope, rp));
    const problems = problemRows.filter((problem) => problemInScope(plant.scope, problem));
    const current = chamadoFacts(plant.chamados, plant.lineNames, range.from, range.to);
    const previous = chamadoFacts(plant.chamados, plant.lineNames, range.previousFrom, range.from);
    const totals = chamadoTotals(current);
    const before = chamadoTotals(previous);
    const inPeriod = plant.chamados.filter((row) => row.occurredAt >= range.from);
    const byWeek = countByWeek(plant.chamados.map((row) => row.occurredAt), weeks);
    return {
      days: plant.filter.days,
      chamados: totals.count,
      previousChamados: before.count,
      avgMinutes: totals.avgMinutes,
      previousAvgMinutes: before.avgMinutes,
      weekly: weeks.map((weekStart) => ({ weekStart, count: byWeek.get(weekStart) ?? 0 })),
      pareto: paretoOf(current),
      repeats: repeatsOf(failureFacts(inPeriod, rps, problems)),
      fourM: fourMOf(rpCauses(rps)),
    };
  }

  private async people(now: Date): Promise<DashboardPeopleDto> {
    const ref = lastClosedQuarter(now);
    const [technicians, away, scores, lastFeedback, settings] = await Promise.all([
      this.read.technicians(),
      this.read.away(),
      this.read.quarterScores(ref),
      this.read.lastFeedback(),
      this.settings.load(),
    ]);
    const ids = technicians.map((member) => member.id);
    return {
      away,
      evaluation: evaluationOf(ref, ids, scores, settings.performanceTarget),
      silentFeedback: silentMembers(technicians, lastFeedback, now, FEEDBACK_SILENCE_DAYS),
    };
  }

  private async assertFactory(id: string | null): Promise<void> {
    if (id && !(await this.refs.factoryExists(id))) {
      throw new DomainError("factory", 400, `Fábrica "${id}" não encontrada. Escolha uma fábrica do cadastro.`);
    }
  }
}

function earliest(a: Date, b: Date): Date {
  return a < b ? a : b;
}
