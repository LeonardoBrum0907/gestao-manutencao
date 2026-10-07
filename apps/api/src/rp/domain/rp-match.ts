// Casa nomes e linhas do texto do RP com o cadastro. Só aceita quando há uma resposta única:
// na dúvida o texto original é guardado e o gestor escolhe na revisão.

export type MemberRef = { id: string; name: string; active: boolean };
export type LineRef = { id: string; name: string; internalCode: string | null; factoryId: string };

export function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text: string): string {
  return plain(text).replace(/[^a-z0-9]/g, "");
}

function tokens(name: string): string[] {
  return plain(name).split(/[^a-z0-9]+/).filter(Boolean);
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

export type MemberMatch = { memberIds: string[]; unmatched: string[] };

export function matchMembers(names: string[], members: MemberRef[]): MemberMatch {
  const memberIds: string[] = [];
  const unmatched: string[] = [];
  for (const name of names) {
    const given = tokens(name);
    const exact = members.filter((member) => plain(member.name) === plain(name));
    const pool = exact.length ? exact : members.filter((member) => nameMatches(given, tokens(member.name)));
    const active = pool.filter((member) => member.active);
    const pick = pool.length === 1 ? pool[0] : active.length === 1 ? active[0] : null;
    if (pick) {
      if (!memberIds.includes(pick.id)) memberIds.push(pick.id);
    } else {
      unmatched.push(name);
    }
  }
  return { memberIds, unmatched };
}

export function matchLine(line: string | null, tag: string | null, lines: LineRef[]): LineRef | null {
  const byCode = (value: string | null) => {
    const wanted = value ? compact(value) : "";
    if (!wanted) return [];
    return lines.filter((line) => line.internalCode && compact(line.internalCode) === wanted);
  };
  const byName = (value: string | null) => {
    const wanted = value ? compact(value) : "";
    if (!wanted) return [];
    return lines.filter((line) => compact(line.name) === wanted);
  };
  for (const found of [byCode(tag), byName(tag), byName(line), byCode(line)]) {
    if (found.length === 1) return found[0]!;
  }
  return null;
}
