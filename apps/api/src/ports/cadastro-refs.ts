export interface CadastroRefs {
  factoryExists(id: string): Promise<boolean>;
  machineExists(id: string): Promise<boolean>;
  memberExists(id: string): Promise<boolean>;
}

export const CADASTRO_REFS = Symbol("CADASTRO_REFS");
