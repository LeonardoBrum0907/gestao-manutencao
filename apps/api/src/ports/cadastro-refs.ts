import type { MemberPosition } from "@manutencao/shared";

export interface CadastroRefs {
  factoryExists(id: string): Promise<boolean>;
  lineExists(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
  // Uma consulta para a lista toda: true quando todos os ids existem.
  linesExist(ids: string[]): Promise<boolean>;
  membersExist(ids: string[]): Promise<boolean>;
  memberPosition(id: string): Promise<MemberPosition | null>;
  // Leitura para casar nomes, linhas e TAGs de texto colado com o cadastro.
  memberDirectory(): Promise<{ id: string; name: string; active: boolean }[]>;
  lineDirectory(): Promise<{ id: string; name: string; internalCode: string | null; factoryId: string }[]>;
}

export const CADASTRO_REFS = Symbol("CADASTRO_REFS");
