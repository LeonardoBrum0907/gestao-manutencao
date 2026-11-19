import { plain } from "./rp-match";

// Casa os técnicos escritos no RP com o cadastro. Só aceita quando há uma resposta única:
// na dúvida o nome fica como veio e o gestor escolhe na revisão.

/** Colaborador como o leitor do RP precisa: apelido e equipe ajudam a desempatar. */
export type MemberRef = { id: string; name: string; active: boolean; nickname?: string | null; teamId?: string | null };

function tokens(name: string): string[] {
  return plain(name).split(/[^a-z0-9]+/).filter(Boolean);
}

// "FabioRS" e "EliasM" (CAM 07, 2026-11): iniciais do sobrenome coladas no nome viram "Fabio R S" e "Elias M".
function splitGluedInitials(name: string): string {
  return name.replace(/(\p{Ll})(\p{Lu}{1,3})(?=$|[^\p{L}])/gu, (_, last: string, caps: string) => `${last} ${[...caps].join(" ")}`);
}

// "Rogério B" casa com "Rogério Barbosa"; "Douglas" casa com quem tem esse primeiro nome.
function nameMatches(given: string[], full: string[]): boolean {
  if (!given.length || given[0] !== full[0]) return false;
  let from = 1;
  for (const part of given.slice(1)) {
    const at = full.findIndex((candidate, index) => index >= from && candidate.startsWith(part));
    if (at < 0) return false;
    from = at + 1;
  }
  return true;
}

// O apelido pode ter mais de um jeito, separado por vírgula: "Zé Tavares, Zé".
function nicknames(member: MemberRef): string[] {
  return (member.nickname ?? "").split(/[,;/]/).map(plain).filter(Boolean);
}

// "Douglas" é o nome do meio de "Elias Douglas Macambira": só vale quando ninguém tem esse primeiro nome.
function hasLaterName(given: string[], full: string[]): boolean {
  return given.length === 1 && full.slice(1).includes(given[0]!);
}

/**
 * Candidatos para um nome do texto, do jeito mais certo ao mais solto: apelido, nome completo, primeiro nome
 * (com iniciais) e, por último, nome do meio.
 * @example candidatesFor("FabioRS", membros) // [Fabio Rogério da Silva]
 */
export function candidatesFor(name: string, members: MemberRef[]): MemberRef[] {
  const wanted = plain(name);
  const given = tokens(splitGluedInitials(name));
  const steps: ((member: MemberRef) => boolean)[] = [
    (member) => nicknames(member).includes(wanted),
    (member) => plain(member.name) === wanted,
    (member) => nameMatches(given, tokens(member.name)),
    (member) => hasLaterName(given, tokens(member.name)),
  ];
  for (const step of steps) {
    const found = members.filter(step);
    if (found.length) return found;
  }
  return [];
}

// Um só candidato, ou um só ativo entre eles.
function uniquePick(pool: MemberRef[]): MemberRef | null {
  if (pool.length === 1) return pool[0]!;
  const active = pool.filter((member) => member.active);
  return active.length === 1 ? active[0]! : null;
}

// Dois "Emerson" ativos: fica o da mesma equipe dos outros técnicos já achados no RP.
function teamPick(pool: MemberRef[], teams: Set<string>): MemberRef | null {
  const sameTeam = pool.filter((member) => member.active && member.teamId && teams.has(member.teamId));
  return sameTeam.length === 1 ? sameTeam[0]! : null;
}

export type MemberMatch = { memberIds: string[]; unmatched: string[] };

/**
 * Técnicos do texto já ligados ao cadastro; quem não deu para decidir fica em unmatched, como veio.
 * @example matchMembers(["Emerson", "Jonas"], membros) // { memberIds: ["emerson-da-equipe-do-jonas", "jonas"], unmatched: [] }
 */
export function matchMembers(names: string[], members: MemberRef[]): MemberMatch {
  const pools = names.map((name) => candidatesFor(name, members));
  const firstPass = pools.map(uniquePick);
  const teams = new Set(firstPass.flatMap((member) => (member?.teamId ? [member.teamId] : [])));
  const picks = pools.map((pool, index) => firstPass[index] ?? teamPick(pool, teams));
  const memberIds = [...new Set(picks.flatMap((member) => (member ? [member.id] : [])))];
  const unmatched = names.filter((_, index) => !picks[index]);
  return { memberIds, unmatched };
}
