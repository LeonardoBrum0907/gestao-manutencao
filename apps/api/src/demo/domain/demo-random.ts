/** Sorteio repetível: a mesma semente dá sempre os mesmos dados de demonstração (e os mesmos testes). */
export type DemoRandom = {
  /** Número entre 0 (incluso) e 1. */
  next(): number;
  /** Inteiro entre min e max, os dois inclusos. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
};

/**
 * Gerador mulberry32: pequeno e bom o bastante para espalhar datas, notas e textos.
 * @example const random = demoRandom(7); random.int(1, 3) // sempre o mesmo valor para a semente 7
 */
export function demoRandom(seed: number): DemoRandom {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: <T>(items: readonly T[]): T => pickFrom(items, int),
    chance: (probability: number): boolean => next() < probability,
  };
}

function pickFrom<T>(items: readonly T[], int: (min: number, max: number) => number): T {
  if (items.length === 0) throw new Error("demoRandom.pick recebeu uma lista vazia; esperava ao menos um item.");
  return items[int(0, items.length - 1)];
}
