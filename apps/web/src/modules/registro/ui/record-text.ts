// Tamanhos de letra do modal do registro. Eram 12px e 13px, herdados do cartão de adicionar, e o Léo achou
// pequenos (2026-10-29): o valor dos campos fica no tamanho do texto das listas (15px) e a nota, um passo abaixo.
// As etiquetas (chips.tsx) repetem o 15px como classe literal: o Tailwind só gera classes escritas por inteiro.

/**
 * Valor de um campo do modal (prazo, horário, lembrete, linha, TAG).
 * Ex.: `<span className={`${recordValueText} text-app`}>30 out</span>`
 */
export const recordValueText = "text-[15px]";

/**
 * Rótulo do campo, ajuda e segunda linha embaixo de um valor.
 * Ex.: `<h3 className={`${recordNoteText} font-semibold text-muted`}>Prazo</h3>`
 */
export const recordNoteText = "text-[13px]";
