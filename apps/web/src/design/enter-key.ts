/** O pedaço do evento de teclado que runOnEnter usa; o KeyboardEvent do React encaixa direto. */
export type EnterKeyEvent = { key: string; nativeEvent?: { isComposing?: boolean }; preventDefault: () => void };

/**
 * Enter num campo que tem botão próprio (como "+ Novo subconjunto") dentro de um formulário maior: roda a ação do
 * campo em vez de enviar o formulário inteiro, que gravava a ficha e deixava o subconjunto sem criar.
 * Enter que só fecha a composição do teclado (acento, sugestão) fica com o teclado.
 * @example <TextInput onKeyDown={(event) => runOnEnter(event, create)} />
 */
export function runOnEnter(event: EnterKeyEvent, action: () => void): void {
  if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
  event.preventDefault();
  action();
}
