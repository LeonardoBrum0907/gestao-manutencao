// O que vai junto (ou perde a ligação) quando um registro é excluído. Nada disso impede a exclusão:
// a tela mostra a lista para o coordenador confirmar sabendo o que acontece.
export type RecordLinks = {
  rp: { orderNumber: string | null; postPreventives: number } | null;
  attachments: number;
  memberNames: string[];
};

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function names(list: string[]): string {
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} e ${list[list.length - 1]}`;
}

export function recordRemovalWarnings(links: RecordLinks): string[] {
  const warnings: string[] = [];
  if (links.rp) {
    const which = links.rp.orderNumber ? `o RP da OS ${links.rp.orderNumber}` : "o RP";
    warnings.push(`Este problema veio de um RP: ${which} é excluído junto.`);
    if (links.rp.postPreventives > 0) {
      warnings.push(`${plural(links.rp.postPreventives, "pós-preventiva perde", "pós-preventivas perdem")} a ligação com esse RP.`);
    }
  }
  if (links.attachments > 0) {
    warnings.push(`${plural(links.attachments, "anexo é apagado", "anexos são apagados")} junto.`);
  }
  if (links.memberNames.length > 0) {
    warnings.push(`Sai do histórico de ${names(links.memberNames)}.`);
  }
  return warnings;
}
