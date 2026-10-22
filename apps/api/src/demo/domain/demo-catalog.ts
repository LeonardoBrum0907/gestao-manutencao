import type { CompetencyLevel, MatrixCategory } from "@manutencao/shared";

// Cadastro da demonstração: nomes numerados e explicativos, sem nada da planta real.

export type DemoFactory = { key: string; name: string };
export type DemoSkill = { subgroup: string; text: string; level: CompetencyLevel; category: MatrixCategory };
export type DemoModel = { key: string; name: string; minQualified: number; subassemblies: string[]; skills: DemoSkill[] };
export type DemoMachine = { key: string; name: string; tag: string; model: string };
export type DemoPlacedMachine = DemoMachine & { line: string };
export type DemoLine = { key: string; name: string; factory: string; isCritical: boolean; isDailyLine: boolean; machines: DemoMachine[] };
export type DemoCatalog = { factories: DemoFactory[]; models: DemoModel[]; lines: DemoLine[] };

export const DEMO_SUBASSEMBLIES = [
  "Subconjunto 1 · Alimentação",
  "Subconjunto 2 · Transporte",
  "Subconjunto 3 · Selagem",
  "Subconjunto 4 · Painel elétrico",
] as const;

// Por subconjunto: duas habilidades de mecânico e uma de eletricista.
const SKILL_ACTIONS: { action: string; category: MatrixCategory }[] = [
  { action: "ajustar e regular", category: "mechanical" },
  { action: "trocar peças de desgaste", category: "mechanical" },
  { action: "diagnosticar falha elétrica", category: "electrical" },
];
const LEVELS: CompetencyLevel[] = ["basic", "intermediate", "advanced"];

// Linha → modelos das máquinas dela, em ordem. As máquinas são numeradas na sequência.
const LINE_MODELS: { name: string; factory: string; models: string[] }[] = [
  { name: "Linha 1", factory: "f1", models: ["a", "b"] },
  { name: "Linha 2", factory: "f1", models: ["a", "c"] },
  { name: "Linha 3", factory: "f1", models: ["b", "c"] },
  { name: "Linha 4", factory: "f2", models: ["a", "b"] },
  { name: "Linha 5", factory: "f2", models: ["c", "a"] },
];

/**
 * Habilidades de um modelo: Habilidade 1, 2, 3… por subconjunto, com nível e categoria variando.
 * @example demoSkills()[0] // { subgroup: "Subconjunto 1 · Alimentação", text: "Habilidade 1: ajustar e regular", level: "basic", category: "mechanical" }
 */
export function demoSkills(): DemoSkill[] {
  return DEMO_SUBASSEMBLIES.flatMap((subgroup, subIndex) =>
    SKILL_ACTIONS.map(({ action, category }, actionIndex) => {
      const number = subIndex * SKILL_ACTIONS.length + actionIndex + 1;
      return { subgroup, text: `Habilidade ${number}: ${action}`, level: LEVELS[(subIndex + actionIndex) % LEVELS.length], category };
    }),
  );
}

/**
 * Modelos de equipamento A, B e C (a tela mostra "Modelo Equipamento A"), todos com os mesmos subconjuntos e habilidades genéricas.
 * @example demoModels().map((model) => model.name) // ["Equipamento A", "Equipamento B", "Equipamento C"]
 */
export function demoModels(): DemoModel[] {
  return ["a", "b", "c"].map((key, index) => ({
    key,
    name: `Equipamento ${key.toUpperCase()}`,
    minQualified: index === 2 ? 1 : 2,
    subassemblies: [...DEMO_SUBASSEMBLIES],
    skills: demoSkills(),
  }));
}

/**
 * Linhas 1 a 5 com duas máquinas cada (Máquina 1 a 10, TAG MAQ-01 a MAQ-10).
 * @example demoLines()[0].machines[1] // { key: "m2", name: "Máquina 2", tag: "MAQ-02", model: "b" }
 */
export function demoLines(): DemoLine[] {
  let machineNumber = 0;
  return LINE_MODELS.map((line, index) => ({
    key: `l${index + 1}`,
    name: line.name,
    factory: line.factory,
    isCritical: index === 0,
    isDailyLine: index < 2,
    machines: line.models.map((model) => {
      machineNumber += 1;
      const number = String(machineNumber).padStart(2, "0");
      return { key: `m${machineNumber}`, name: `Máquina ${machineNumber}`, tag: `MAQ-${number}`, model };
    }),
  }));
}

/** O cadastro inteiro da demonstração. */
export function demoCatalog(): DemoCatalog {
  return {
    factories: [
      { key: "f1", name: "Fábrica 1" },
      { key: "f2", name: "Fábrica 2" },
    ],
    models: demoModels(),
    lines: demoLines(),
  };
}

/**
 * Todas as máquinas, com a linha de cada uma.
 * @example demoMachines(demoCatalog())[9] // { key: "m10", …, line: "l5" }
 */
export function demoMachines(catalog: DemoCatalog): DemoPlacedMachine[] {
  return catalog.lines.flatMap((line) => line.machines.map((machine) => ({ ...machine, line: line.key })));
}

/**
 * Modelo de uma máquina: os subconjuntos dela são os do modelo.
 * @example demoMachineModel(demoCatalog(), "m4") // "c"
 */
export function demoMachineModel(catalog: DemoCatalog, machineKey: string): string {
  const machine = demoMachines(catalog).find((item) => item.key === machineKey);
  if (!machine) throw new Error(`Demonstração: máquina "${machineKey}" não existe no cadastro; esperava m1 a m10.`);
  return machine.model;
}
