import type { PublicRpDirectoryDto, PublicRpFields, RpDto, RpPageDto, RpPublicLinkDto, RpRevisionDto, RpRevisionKind, RpSource } from "@manutencao/shared";
import type { RpInput } from "../../rp/application/parse-rp";
import type { RpListQuery } from "../../rp/application/parse-rp-list";

// O que a página pública usa do módulo de RP (a classe Rps cumpre isto).
export interface RpBook {
  get(id: string): Promise<RpDto>;
  page(query: RpListQuery): Promise<RpPageDto>;
  createFrom(input: RpInput, origin: RpSource): Promise<RpDto>;
  updateFrom(id: string, input: RpInput): Promise<RpDto>;
  setChecked(id: string, at: Date | null): Promise<RpDto>;
  setReviewRequest(id: string, text: string | null, at: Date | null): Promise<RpDto>;
}

export interface PublicLinkStore {
  active(): Promise<RpPublicLinkDto | null>;
  isActive(code: string): Promise<boolean>;
  // Desliga o link ativo e cria outro, numa transação só.
  replace(code: string, at: Date): Promise<RpPublicLinkDto>;
  revokeAll(at: Date): Promise<void>;
}

export type RevisionWrite = { rpId: string; kind: RpRevisionKind; before: PublicRpFields; note: string | null };

export interface RpRevisionStore {
  add(write: RevisionWrite): Promise<RpRevisionDto>;
  list(rpId: string): Promise<RpRevisionDto[]>;
  find(id: string): Promise<RpRevisionDto | null>;
}

export interface PublicDirectoryStore {
  directory(): Promise<PublicRpDirectoryDto>;
  // Liberados na ficha do colaborador e não inativos.
  allowedMemberIds(): Promise<string[]>;
  memberNames(ids: string[]): Promise<Map<string, string>>;
  // null quando o colaborador não existe.
  setMemberPublicRp(memberId: string, enabled: boolean): Promise<{ id: string; publicRp: boolean } | null>;
}

export const RP_BOOK = Symbol("RP_BOOK");
export const PUBLIC_LINK_STORE = Symbol("PUBLIC_LINK_STORE");
export const RP_REVISION_STORE = Symbol("RP_REVISION_STORE");
export const PUBLIC_DIRECTORY_STORE = Symbol("PUBLIC_DIRECTORY_STORE");
export const PUBLIC_WRITE_LIMITER = Symbol("PUBLIC_WRITE_LIMITER");
export const PUBLIC_CLOCK = Symbol("PUBLIC_CLOCK");

export type Clock = () => Date;
