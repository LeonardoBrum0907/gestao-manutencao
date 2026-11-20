import type { BehaviorTagDto } from "@manutencao/shared";
import { demoDay } from "../domain/demo-calendar";
import { demoSkills } from "../domain/demo-catalog";
import { DEMO_PDIS, demoBehavior, demoPerformanceScore, demoQuarters, type DemoPdi } from "../domain/demo-development";
import { DEMO_GRADE_EXPECTED, DEMO_MATRIX_PROFILES, DEMO_QUALIFIED_ADHERENCE, demoMatrixScores, type DemoMatrixProfile } from "../domain/demo-matrix";
import type { DemoPeople, DemoPerson } from "../domain/demo-people";
import type { DemoRandom } from "../domain/demo-random";
import type { DemoIds, DemoServices } from "./demo-services";

type DevelopmentContext = { services: DemoServices; ids: DemoIds; random: DemoRandom; today: Date };

/**
 * Matriz de habilidades, avaliação de desempenho do ano, comportamento e PDI dos técnicos.
 * @example await seedDevelopment({ services, ids, random, today }, demoPeople())
 */
export async function seedDevelopment(context: DevelopmentContext, people: DemoPeople): Promise<void> {
  const technicians = people.people.filter((person) => person.role !== "Supervisor");
  const competencies = (await context.services.competencies.list()).filter((item) => !item.archived).map((item) => item.id);
  const tags = await context.services.behaviorTags.list();
  await seedMatrixRules(context.services);
  for (const profile of DEMO_MATRIX_PROFILES) {
    await seedMatrix(context, profile, people);
  }
  for (const person of technicians) {
    await seedPerformance(context, person, competencies);
    await seedBehavior(context, person, tags);
  }
  for (const pdi of DEMO_PDIS) await seedPdi(context, pdi, competencies);
}

// Esperado por grau e aderência que qualifica iguais aos da produção, para o cenário ler como lá.
async function seedMatrixRules(services: DemoServices): Promise<void> {
  const grades = await services.grades.list();
  for (const [index, expected] of DEMO_GRADE_EXPECTED.entries()) {
    const grade = grades.at(index);
    if (grade) await services.grades.setExpected(grade.id, { expected });
  }
  await services.matrixSettings.update({ qualifiedAdherence: DEMO_QUALIFIED_ADHERENCE });
}

async function seedMatrix({ services, ids }: DevelopmentContext, profile: DemoMatrixProfile, people: DemoPeople): Promise<void> {
  const person = people.people.find((item) => item.key === profile.member);
  if (!person) throw new Error(`Demonstração: perfil da matriz para "${profile.member}", que não está na equipe (c1 a c12).`);
  const memberId = ids.get("person", person.key);
  const models = Object.keys(profile.targets);
  await services.memberMatrix.setEquipments(memberId, { equipments: models.map((model) => ids.get("model", model)) });
  const category = person.role === "eletricista" ? "electrical" : "mechanical";
  const expected = DEMO_GRADE_EXPECTED[person.gradeIndex ?? 0];
  const entries = models.flatMap((model) => {
    const scores = demoMatrixScores({ skills: demoSkills(), category, expected, target: profile.targets[model], strong: profile.strong, salt: `${person.key}|${model}` });
    return scores.flatMap((score, index) => (score === null ? [] : [{ skillId: ids.get("skill", `${model}|${index}`), score }]));
  });
  await services.memberMatrix.setSkills(memberId, { entries });
}

async function seedPerformance({ services, ids, random, today }: DevelopmentContext, person: DemoPerson, competencies: string[]): Promise<void> {
  const memberId = ids.get("person", person.key);
  const year = String(today.getUTCFullYear());
  for (const quarter of demoQuarters(today)) {
    for (const competencyId of competencies) {
      const score = demoPerformanceScore(random, person.gradeIndex ?? 0);
      await services.performance.setScore(memberId, year, String(quarter), competencyId, { score });
    }
  }
}

// Um ponto forte sempre; às vezes um ponto de atenção.
async function seedBehavior({ services, ids, random }: DevelopmentContext, person: DemoPerson, tags: BehaviorTagDto[]): Promise<void> {
  const strengths = tags.filter((tag) => tag.group === "strengths");
  const attention = tags.filter((tag) => tag.group === "attention");
  const chosen = [random.pick(strengths).id];
  if (random.chance(0.4)) chosen.push(random.pick(attention).id);
  await services.behavior.save(ids.get("person", person.key), { ...demoBehavior(random), tags: chosen });
}

async function seedPdi({ services, ids, today }: DevelopmentContext, pdi: DemoPdi, competencies: string[]): Promise<void> {
  const memberId = ids.get("person", pdi.member);
  const lines = (keys: string[]): string[] => keys.map((key) => ids.get("line", key));
  await services.pdi.setLines(memberId, { sponsor: lines(pdi.sponsor), development: lines(pdi.development) });
  for (const item of pdi.items) {
    await services.pdiItems.create(memberId, {
      title: item.title,
      skillId: item.skill ? ids.get("skill", `${item.skill.model}|${item.skill.index}`) : null,
      competencyId: item.competencyIndex === null ? null : competencies[item.competencyIndex] ?? null,
      lineId: ids.optional("line", item.line),
      responsibleId: ids.optional("person", item.responsible),
      dueDate: item.dueInDays === null ? null : demoDay(today, -item.dueInDays),
      status: item.status,
    });
  }
}
