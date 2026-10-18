import { Injectable, OnModuleInit, type Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { MemberBehavior } from "../../avaliacao/application/member-behavior";
import { MemberPdi } from "../../avaliacao/application/member-pdi";
import { MemberPdiItems } from "../../avaliacao/application/member-pdi-items";
import { MemberPerformance } from "../../avaliacao/application/member-performance";
import { Factories } from "../../cadastro/application/factories";
import { Lines } from "../../cadastro/application/lines";
import { Machines } from "../../cadastro/application/machines";
import { Members } from "../../cadastro/application/members";
import { Subassemblies } from "../../cadastro/application/subassemblies";
import { Teams } from "../../cadastro/application/teams";
import { MatrixCatalog } from "../../competencia/application/matrix-catalog";
import { MemberMatrix } from "../../competencia/application/member-matrix";
import { TeamMatrix } from "../../competencia/application/team-matrix";
import { ShowDashboard } from "../../dashboard/application/show-dashboard";
import { TechCards } from "../../documentacao/application/tech-cards";
import { TechDocuments } from "../../documentacao/application/tech-documents";
import { PostPreventives } from "../../pos-preventiva/application/post-preventives";
import { Records } from "../../registro/application/records";
import { RecordsList } from "../../registro/application/records-list";
import { Rps } from "../../rp/application/rps";
import { Chamados } from "../../turno/application/chamados";
import { CadastroLinksRepository } from "../infra/cadastro-links.repository";

// As ferramentas chamam os mesmos casos de uso das telas. Eles não são exportados pelos módulos,
// então vêm do container do Nest depois que tudo subiu.
@Injectable()
export class McpUseCases implements OnModuleInit {
  dashboard!: ShowDashboard;
  factories!: Factories;
  lines!: Lines;
  machines!: Machines;
  subassemblies!: Subassemblies;
  members!: Members;
  teams!: Teams;
  chamados!: Chamados;
  records!: Records;
  recordsList!: RecordsList;
  rps!: Rps;
  postPreventives!: PostPreventives;
  memberMatrix!: MemberMatrix;
  matrixCatalog!: MatrixCatalog;
  teamMatrix!: TeamMatrix;
  performance!: MemberPerformance;
  pdi!: MemberPdi;
  pdiItems!: MemberPdiItems;
  behavior!: MemberBehavior;
  techCards!: TechCards;
  techDocuments!: TechDocuments;

  constructor(
    private readonly modules: ModuleRef,
    // Só a exclusão pela IA usa: conta o que perderia a ligação (ver mcp-cadastro-removal.ts).
    readonly cadastroLinks: CadastroLinksRepository,
  ) {}

  onModuleInit(): void {
    const get = <T>(type: Type<T>): T => this.modules.get(type, { strict: false });
    this.dashboard = get(ShowDashboard);
    this.factories = get(Factories);
    this.lines = get(Lines);
    this.machines = get(Machines);
    this.subassemblies = get(Subassemblies);
    this.members = get(Members);
    this.teams = get(Teams);
    this.chamados = get(Chamados);
    this.records = get(Records);
    this.recordsList = get(RecordsList);
    this.rps = get(Rps);
    this.postPreventives = get(PostPreventives);
    this.memberMatrix = get(MemberMatrix);
    this.matrixCatalog = get(MatrixCatalog);
    this.teamMatrix = get(TeamMatrix);
    this.performance = get(MemberPerformance);
    this.pdi = get(MemberPdi);
    this.pdiItems = get(MemberPdiItems);
    this.behavior = get(MemberBehavior);
    this.techCards = get(TechCards);
    this.techDocuments = get(TechDocuments);
  }
}
