// O time escreve linha e TAG de muitos jeitos no RP do WhatsApp: "med6", "Med 06", "MED-06", "Cam#05.",
// "EBS-DOB-34.", "EBS BLI 6". Estas funções reduzem o texto às letras e aos números (sem zero à esquerda),
// para o leitor do RP (API) e a escolha da máquina pela TAG (web) compararem do mesmo jeito.

/** Letras e números de uma linha ou TAG, sem acento, sem pontuação e sem zero à esquerda. */
export type RpPlaceKey = { letters: string; numbers: string };

// Menos que isso ("C 1", "M6") é curto demais para adivinhar a linha pelo começo do nome.
const MIN_PREFIX_LETTERS = 3;

function foldPlace(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// "Linha Med 06" e "MED 06 (encartuchadeira)": a palavra "linha" e o comentário entre parênteses não fazem parte do nome.
function stripPlaceNoise(text: string): string {
  return text.replace(/\([^)]*\)/g, " ").replace(/^\s*linha\b/, " ");
}

/**
 * Letras e números do texto, cada grupo de números sem zero à esquerda e separado do vizinho por "|".
 * @example rpPlaceKey("Med 06") // { letters: "med", numbers: "6" }
 * @example rpPlaceKey("EBS-BLI-21.") // { letters: "ebsbli", numbers: "21" }
 */
export function rpPlaceKey(text: string): RpPlaceKey {
  const parts = stripPlaceNoise(foldPlace(text)).match(/[a-z]+|\d+/g) ?? [];
  const letters = parts.filter((part) => /^[a-z]/.test(part)).join("");
  const numbers = parts.filter((part) => /^\d/.test(part)).map((part) => String(Number(part))).join("|");
  return { letters, numbers };
}

function isBlankKey(key: RpPlaceKey): boolean {
  return !key.letters && !key.numbers;
}

/**
 * Mesma TAG ou mesmo nome, ignorando caixa, acento, espaço, pontuação e zero à esquerda.
 * @example sameRpPlace("EBS-BLI-6", "ebs bli 06") // true
 * @example sameRpPlace("med6", "MED 06") // true
 */
export function sameRpPlace(given: string, saved: string): boolean {
  const a = rpPlaceKey(given);
  const b = rpPlaceKey(saved);
  if (isBlankKey(a) || isBlankKey(b)) return false;
  return a.letters === b.letters && a.numbers === b.numbers;
}

/**
 * Nome encurtado ou alongado com o mesmo número: "Uhl 2" é UHLMANN 02, "Medseal 07" é MED 07,
 * "BLISTER 03" é BLISTERFLEX 03 e "Romaco Sachês" é ROMACO SACHE. Quem chama só aceita se sobrar uma linha.
 * @example rpPlacePrefixMatch("Uhl 2", "UHLMANN 02") // true
 */
export function rpPlacePrefixMatch(given: string, saved: string): boolean {
  const a = rpPlaceKey(given);
  const b = rpPlaceKey(saved);
  if (a.numbers !== b.numbers) return false;
  const [shorter, longer] = a.letters.length <= b.letters.length ? [a.letters, b.letters] : [b.letters, a.letters];
  return shorter.length >= MIN_PREFIX_LETTERS && longer.startsWith(shorter);
}
