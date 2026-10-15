/**
 * Texto do botão que mostra os outros filtros no celular, com quantos deles estão em uso, para o filtro escondido
 * não sumir da vista.
 * @example moreFiltersLabel(0) // "Mais filtros"
 * @example moreFiltersLabel(2) // "Mais filtros (2 em uso)"
 */
export function moreFiltersLabel(active: number): string {
  return active > 0 ? `Mais filtros (${active} em uso)` : "Mais filtros";
}
