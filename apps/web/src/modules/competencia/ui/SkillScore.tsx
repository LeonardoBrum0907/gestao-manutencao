import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COMPETENCY_SCORE_LABELS, COMPETENCY_SCORES, type CompetencyScore } from "@manutencao/shared";
import type { SkillState } from "../model/matrix";

export type ScoreValue = { score: CompetencyScore | null; notApplicable: boolean };

const pillTone: Record<SkillState, string> = {
  meets: "border-accent bg-accent text-accent-contrast",
  below: "border-danger bg-danger text-canvas",
  unscored: "border-line bg-surface text-muted hover:bg-chip",
  na: "border-line bg-chip text-muted",
};

export function scoreLabel({ score, notApplicable }: ScoreValue): string {
  if (notApplicable) return "Não se aplica";
  return score === null ? "Sem nota" : COMPETENCY_SCORE_LABELS[score].label;
}

const optionClass = "flex w-full items-start gap-3 rounded-control px-2 py-2 text-left text-sm text-app transition hover:bg-chip focus:bg-chip focus:outline-none";

// Menu fora da lista (portal) para não ser cortado pelo cartão do equipamento; abre para cima se faltar espaço embaixo.
function Menu({
  anchor,
  value,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  value: ScoreValue;
  onPick: (next: ScoreValue) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const rect = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    const below = rect.bottom + 4 + height <= window.innerHeight;
    setPos({
      top: below ? rect.bottom + 4 : Math.max(8, rect.top - 4 - height),
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    });
  }, [anchor]);

  useEffect(() => {
    const options = ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [];
    const current = value.notApplicable ? options[COMPETENCY_SCORES.length] : value.score === null ? options[0] : options[value.score];
    (current ?? options[0])?.focus();
    function outside(event: Event) {
      if (!ref.current?.contains(event.target as Node) && !anchor.contains(event.target as Node)) onClose();
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        anchor.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const list = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
      const index = list.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      list[(next + list.length) % list.length]?.focus();
    }
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
    // Monta uma vez por abertura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden" }}
      className="z-50 w-80 rounded-card border border-line bg-card p-1 shadow-card"
    >
      {COMPETENCY_SCORES.map((score) => (
        <button
          key={score}
          type="button"
          role="menuitemradio"
          aria-checked={!value.notApplicable && value.score === score}
          className={`${optionClass} ${!value.notApplicable && value.score === score ? "bg-accent-soft" : ""}`}
          onClick={() => onPick({ score, notApplicable: false })}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-control bg-chip text-xs font-bold tabular-nums">{score}</span>
          <span>
            <span className="font-medium">{COMPETENCY_SCORE_LABELS[score].label}</span>
            <span className="block text-xs text-muted">{COMPETENCY_SCORE_LABELS[score].hint}</span>
          </span>
        </button>
      ))}
      <div className="my-1 h-px bg-line" />
      <button
        type="button"
        role="menuitemradio"
        aria-checked={value.notApplicable}
        className={`${optionClass} ${value.notApplicable ? "bg-accent-soft" : ""}`}
        onClick={() => onPick({ score: null, notApplicable: true })}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-control bg-chip text-xs font-bold">N</span>
        <span>
          <span className="font-medium">Não se aplica</span>
          <span className="block text-xs text-muted">Fica fora da conta de aderência.</span>
        </span>
      </button>
      <button type="button" role="menuitem" className={optionClass} onClick={() => onPick({ score: null, notApplicable: false })}>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-control bg-chip text-xs font-bold">⌫</span>
        <span className="font-medium">Limpar nota</span>
      </button>
    </div>,
    document.body,
  );
}

export function SkillScore({
  skillText,
  state,
  value,
  onPick,
}: {
  skillText: string;
  state: SkillState;
  value: ScoreValue;
  onPick: (next: ScoreValue) => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Nota em ${skillText}: ${scoreLabel(value)}`}
        data-skill-pill
        onClick={() => setOpen((current) => !current)}
        className={`flex w-44 shrink-0 items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${pillTone[state]}`}
      >
        <span className="truncate">{scoreLabel(value)}</span>
        <span className="flex items-center gap-1 text-xs opacity-80">
          {!value.notApplicable && value.score !== null ? <span className="tabular-nums">{value.score}</span> : null}
          <span aria-hidden="true">▾</span>
        </span>
      </button>
      {open && button.current ? (
        <Menu
          anchor={button.current}
          value={value}
          onPick={(next) => {
            setOpen(false);
            onPick(next);
            button.current?.focus();
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
