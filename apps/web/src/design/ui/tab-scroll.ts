// Folga para a aba não encostar na borda da faixa e deixar um pedaço da vizinha à vista (sinal de que há mais abas).
const TAB_EDGE_GAP = 24;

/** Posição de uma aba dentro da faixa: início e fim medidos a partir do começo do conteúdo rolável. */
export type TabSpan = { start: number; end: number };

/**
 * Para onde rolar a faixa de abas para a aba atual ficar inteira à vista; se ela já está, a faixa não se mexe.
 * @example nav.scrollLeft = tabBarScrollLeft(nav.scrollLeft, nav.clientWidth, { start: 380, end: 460 });
 */
export function tabBarScrollLeft(scrollLeft: number, width: number, tab: TabSpan): number {
  if (tab.start < scrollLeft) return Math.max(0, tab.start - TAB_EDGE_GAP);
  if (tab.end > scrollLeft + width) return tab.end - width + TAB_EDGE_GAP;
  return scrollLeft;
}
