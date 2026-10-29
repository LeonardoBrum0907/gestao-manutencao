import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { loopedTop, typedItem, wheelIndex, wheelTop, WHEEL_COPIES } from "./clock-text";

// Roda de rolar do seletor de horário, como a do alarme do celular: arrasta (ou gira o mouse) e o número que
// parar no centro é o escolhido. A lista se repete WHEEL_COPIES vezes e volta para a cópia do meio quando para,
// por isso não tem fim. Linhas visíveis: duas acima, a do centro e duas abaixo.

const VISIBLE_ROWS = 5;
const SETTLE_MS = 120;
const TYPED_PAUSE_MS = 800;
const ARROW_STEPS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 };
// Some aos poucos em cima e embaixo. A máscara só usa a transparência, não a cor.
const FADE = "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)";

type TimeWheelProps = {
  label: string;
  items: string[];
  value: string;
  // Altura de cada linha, em px.
  row: number;
  // Tamanho da letra e largura da roda.
  sizeClass: string;
  // No computador a roda da hora já abre focada, para o teclado (setas e números).
  autoFocus?: boolean;
  onChange: (item: string) => void;
};

// Linha que está no centro; muda enquanto rola, para o número do meio ficar destacado na hora.
// follow devolve a linha nova quando ela mudou, ou null.
function useCenterRow(row: number, startTop: number) {
  const [center, setCenter] = useState(() => Math.round(startTop / row));
  const follow = (top: number): number | null => {
    const next = Math.round(top / row);
    if (next === center) return null;
    setCenter(next);
    return next;
  };
  return { center, follow };
}

// Digitar na roda focada pula para o número: "1" e "4" seguidos levam ao 14.
function useTypedJump(items: string[]) {
  const typed = useRef({ text: "", at: 0 });
  return (key: string): string | null => {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at < TYPED_PAUSE_MS ? typed.current.text : "") + key, at: now };
    return typedItem(typed.current.text, items);
  };
}

/**
 * Roda sem fim de um seletor. `value` só vale ao abrir; depois a roda manda `onChange` a cada número que chega ao centro.
 * Ex.: `<TimeWheel label="Hora" items={CLOCK_HOURS} value="14" row={36} sizeClass="w-16 text-xl" onChange={setHour} />`
 */
export function TimeWheel({ label, items, value, row, sizeClass, autoFocus = false, onChange }: TimeWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef(0);
  const count = items.length;
  const startTop = wheelTop(Math.max(0, items.indexOf(value)), count, row);
  const { center, follow } = useCenterRow(row, startTop);
  const jump = useTypedJump(items);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = startTop;
    if (autoFocus) ref.current.focus({ preventScroll: true });
    // Só ao abrir: depois quem manda é a rolagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  function settle() {
    const wheel = ref.current;
    if (!wheel) return;
    const top = loopedTop(wheel.scrollTop, count, row);
    if (Math.abs(top - wheel.scrollTop) >= 1) wheel.scrollTop = top;
  }
  // Avisa a cada número que passa pelo centro, não só quando para: tocar em Pronto com a roda ainda
  // girando grava o número que está à vista (antes gravava o anterior).
  function onScroll() {
    const moved = follow(ref.current?.scrollTop ?? 0);
    if (moved !== null) onChange(items[wheelIndex(moved * row, row, count)]);
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, SETTLE_MS);
  }
  const goToRow = (target: number) => ref.current?.scrollTo({ top: target * row, behavior: "smooth" });

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps = ARROW_STEPS[event.key];
    if (steps) {
      event.preventDefault();
      return goToRow(center + steps);
    }
    if (!/^\d$/.test(event.key)) return;
    const item = jump(event.key);
    if (item !== null) goToRow(center - wheelIndex(center * row, row, count) + items.indexOf(item));
  }

  return (
    <div className={`relative ${sizeClass}`} style={{ height: row * VISIBLE_ROWS }}>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 rounded-lg bg-chip" style={{ top: row * 2, height: row }} />
      <div
        ref={ref}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={Number(items[wheelIndex(center * row, row, count)])}
        aria-valuetext={items[wheelIndex(center * row, row, count)]}
        aria-valuemin={Number(items[0])}
        aria-valuemax={Number(items[count - 1])}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className="time-wheel relative h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        style={{ paddingBlock: row * 2, maskImage: FADE, WebkitMaskImage: FADE }}
      >
        {Array.from({ length: WHEEL_COPIES * count }, (_, index) => (
          <div
            key={index}
            onClick={() => goToRow(index)}
            style={{ height: row }}
            className={`flex cursor-pointer select-none snap-center items-center justify-center tabular-nums transition-colors ${index === center ? "font-semibold text-app" : "text-muted"}`}
          >
            {items[index % count]}
          </div>
        ))}
      </div>
    </div>
  );
}
