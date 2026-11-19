// Casa a linha do texto do RP com o cadastro. Só aceita quando há uma resposta única:
// na dúvida o texto original é guardado e o gestor escolhe na revisão.

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
