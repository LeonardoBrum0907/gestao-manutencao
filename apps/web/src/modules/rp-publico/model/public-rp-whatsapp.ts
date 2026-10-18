import { rpWhatsappText, type PublicRpDirectoryDto, type PublicRpDto } from "@manutencao/shared";

/**
 * Texto do RP público no modelo do grupo do WhatsApp. A linha sai com o nome do cadastro quando o RP aponta
 * uma; sem cadastro, fica a linha escrita à mão.
 * @example publicRpWhatsappText(rp, directory.lines) // "*RELATÓRIO PADRÃO – MANUTENÇÃO*\n…"
 */
export function publicRpWhatsappText(rp: PublicRpDto, lines: PublicRpDirectoryDto["lines"]): string {
  const registered = rp.lineId ? lines.find((line) => line.id === rp.lineId)?.name : undefined;
  return rpWhatsappText({ ...rp, line: registered ?? rp.line, technicians: rp.memberNames });
}
