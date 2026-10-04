import type { MemberPosition } from "@manutencao/shared";

export interface CadastroRefs {
  factoryExists(id: string): Promise<boolean>;
  machineExists(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
  memberPosition(id: string): Promise<MemberPosition | null>;
}

export const CADASTRO_REFS = Symbol("CADASTRO_REFS");
