import type { MemberPosition } from "@manutencao/shared";

export interface CadastroRefs {
  factoryExists(id: string): Promise<boolean>;
  machineExists(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
  // Uma consulta para a lista toda: true quando todos os ids existem.
  machinesExist(ids: string[]): Promise<boolean>;
  membersExist(ids: string[]): Promise<boolean>;
  memberPosition(id: string): Promise<MemberPosition | null>;
}

export const CADASTRO_REFS = Symbol("CADASTRO_REFS");
