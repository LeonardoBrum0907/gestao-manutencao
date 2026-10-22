import type { BehaviorTags } from "../../avaliacao/application/behavior-tags";
import type { Competencies } from "../../avaliacao/application/competencies";
import type { MemberBehavior } from "../../avaliacao/application/member-behavior";
import type { MemberPdi } from "../../avaliacao/application/member-pdi";
import type { MemberPdiItems } from "../../avaliacao/application/member-pdi-items";
import type { MemberPerformance } from "../../avaliacao/application/member-performance";
import type { Factories } from "../../cadastro/application/factories";
import type { Grades } from "../../cadastro/application/grades";
import type { Lines } from "../../cadastro/application/lines";
import type { Machines } from "../../cadastro/application/machines";
import type { Members } from "../../cadastro/application/members";
import type { Roles } from "../../cadastro/application/roles";
import type { Subassemblies } from "../../cadastro/application/subassemblies";
import type { Teams } from "../../cadastro/application/teams";
import type { MatrixCatalog } from "../../competencia/application/matrix-catalog";
import type { MemberMatrix } from "../../competencia/application/member-matrix";
import type { TechCards } from "../../documentacao/application/tech-cards";
import type { PostPreventives } from "../../pos-preventiva/application/post-preventives";
import type { Records } from "../../registro/application/records";
import type { Rps } from "../../rp/application/rps";
import type { PublicLinks } from "../../rp-publico/application/public-links";
import type { PublicRps } from "../../rp-publico/application/public-rps";
import type { RpReviews } from "../../rp-publico/application/rp-reviews";
import type { SupervisorLinks } from "../../rp-publico/application/supervisor-links";
import type { Chamados } from "../../turno/application/chamados";
import type { DemoDatabaseCounts } from "../domain/demo-guard";

/**
 * Os casos de uso das telas que a carga chama: os dados passam pelas mesmas regras de quem usa o app.
 * Vêm do container do Nest (seed-demo.ts) ou, nos testes, de falsos.
 */
export type DemoServices = {
  factories: Factories;
  lines: Lines;
  machines: Machines;
  subassemblies: Subassemblies;
  matrixCatalog: MatrixCatalog;
  roles: Roles;
  grades: Grades;
  teams: Teams;
  members: Members;
  memberMatrix: MemberMatrix;
  performance: MemberPerformance;
  competencies: Competencies;
  behaviorTags: BehaviorTags;
  behavior: MemberBehavior;
  pdi: MemberPdi;
  pdiItems: MemberPdiItems;
  chamados: Chamados;
  records: Records;
  rps: Rps;
  publicLinks: PublicLinks;
  supervisorLinks: SupervisorLinks;
  publicRps: PublicRps;
  rpReviews: RpReviews;
  postPreventives: PostPreventives;
  techCards: TechCards;
};

/** O que a carga faz direto no banco: o que nenhuma tela faz (apagar o catálogo de partida, voltar datas). */
export interface DemoDatabase {
  counts(): Promise<DemoDatabaseCounts>;
  // As migrações trazem o catálogo da matriz do SIGEM (modelos, subconjuntos e habilidades), com nomes de fabricantes reais.
  removeStarterCatalog(): Promise<void>;
  // Cadastro, registros, RPs e fichas ficam com a data de quando "aconteceram", não a da carga.
  backdate(createdAt: Date): Promise<void>;
  setCompletedAt(recordId: string, completedAt: Date): Promise<void>;
}

/**
 * Chaves da demonstração (f1, l1, m1, c1…) para os ids que o banco gerou.
 * @example const ids = new DemoIds(); ids.set("machine", "m1", "cm1"); ids.get("machine", "m1") // "cm1"
 */
export class DemoIds {
  private readonly byKind = new Map<string, Map<string, string>>();

  set(kind: string, key: string, id: string): void {
    const map = this.byKind.get(kind) ?? new Map<string, string>();
    map.set(key, id);
    this.byKind.set(kind, map);
  }

  get(kind: string, key: string): string {
    const id = this.byKind.get(kind)?.get(key);
    if (!id) throw new Error(`Demonstração: ${kind} "${key}" não foi criado antes de ser usado; confira a ordem da carga.`);
    return id;
  }

  optional(kind: string, key: string | null): string | null {
    return key === null ? null : this.get(kind, key);
  }
}
