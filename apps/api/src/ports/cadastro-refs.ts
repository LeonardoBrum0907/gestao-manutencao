import type { MemberPosition } from "@manutencao/shared";
import type { MachineSpotRefs } from "../cadastro/domain/hierarchy";

/** Colaborador para casar com o nome escrito no RP: a equipe desempata dois com o mesmo primeiro nome. */
export type MemberTextRef = { id: string; name: string; active: boolean; teamId: string | null };

export interface CadastroRefs {
  factoryExists(id: string): Promise<boolean>;
  lineExists(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
  // Uma consulta para a lista toda: true quando todos os ids existem.
  linesExist(ids: string[]): Promise<boolean>;
  membersExist(ids: string[]): Promise<boolean>;
  memberPosition(id: string): Promise<MemberPosition | null>;
  // Linha e modelo da máquina e o subconjunto, para conferir a escolha de uma ficha. Id nulo volta nulo.
  machineSpot(machineId: string | null, subassemblyId: string | null): Promise<MachineSpotRefs>;
  // Leitura para casar nomes, linhas e TAGs de texto colado com o cadastro.
  memberDirectory(): Promise<MemberTextRef[]>;
  lineDirectory(): Promise<{ id: string; name: string; internalCode: string | null; factoryId: string }[]>;
}

export const CADASTRO_REFS = Symbol("CADASTRO_REFS");
