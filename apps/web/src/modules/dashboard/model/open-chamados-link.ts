import type { DashboardChamadoDto } from "@manutencao/shared";
import { dayOf } from "../../turno/model/chamado";

/**
 * Para onde vão "Chamados abertos" e "Ver chamados": o dia do chamado aberto mais antigo. A tela de Chamados mostra
 * um dia só e abre em hoje, então um chamado aberto ontem sumia ("Nenhum chamado neste dia").
 * @example openChamadosLink([{ openedAt: "2026-10-14T18:10:00.000Z" }]) // "/turno/chamados?dia=2026-10-14"
 * @example openChamadosLink([]) // "/turno/chamados"
 */
export function openChamadosLink(chamados: readonly Pick<DashboardChamadoDto, "openedAt">[]): string {
  if (!chamados.length) return "/turno/chamados";
  const oldest = Math.min(...chamados.map((chamado) => new Date(chamado.openedAt).getTime()));
  return `/turno/chamados?dia=${dayOf(new Date(oldest))}`;
}
