import { useState } from "react";
import { Button, Modal } from "./controls";

export type PickerSection<K extends string> = { key: K; label: string; disabledWhen?: K };

type SectionPickerProps<K extends string> = {
  title: string;
  intro: string;
  allLabel: string;
  confirmLabel: string;
  sections: readonly PickerSection<K>[];
  onConfirm: (selected: K[]) => void;
  onClose: () => void;
};

/**
 * Janela de "o que entra no PDF": uma caixa por seção, abre com todas marcadas. Seção com `disabledWhen` só vale
 * se a seção que ela depende estiver marcada (ex.: legenda da grade sem a grade).
 * @example <SectionPickerModal title="Relatório PDF" sections={sections} onConfirm={(keys) => navigate(path(keys))} … />
 */
export function SectionPickerModal<K extends string>({ title, intro, allLabel, confirmLabel, sections, onConfirm, onClose }: SectionPickerProps<K>) {
  const [selected, setSelected] = useState<K[]>(sections.map((section) => section.key));
  const toggle = (key: K) => setSelected((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const isOff = (section: PickerSection<K>) => Boolean(section.disabledWhen && !selected.includes(section.disabledWhen));
  const ordered = sections.filter((section) => selected.includes(section.key) && !isOff(section)).map((section) => section.key);
  return (
    <Modal open title={title} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{intro}</p>
      <div className="mb-3 flex gap-3 text-sm font-medium text-accent">
        <button type="button" className="hover:underline" onClick={() => setSelected(sections.map((section) => section.key))}>
          {allLabel}
        </button>
        <button type="button" className="hover:underline" onClick={() => setSelected([])}>
          Limpar
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {sections.map((section) => (
          <li key={section.key}>
            <SectionRow section={section} checked={selected.includes(section.key)} off={isOff(section)} onToggle={() => toggle(section.key)} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button tone="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={ordered.length === 0} onClick={() => onConfirm(ordered)}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

function SectionRow<K extends string>({ section, checked, off, onToggle }: { section: PickerSection<K>; checked: boolean; off: boolean; onToggle: () => void }) {
  const indent = section.disabledWhen ? "ml-6" : "";
  return (
    <label
      className={`flex items-center gap-3 rounded-control border border-line px-3 py-2.5 text-sm transition ${indent} ${
        off ? "cursor-not-allowed text-muted opacity-60" : "cursor-pointer text-app hover:bg-accent-soft"
      }`}
    >
      <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={checked && !off} disabled={off} onChange={onToggle} />
      {section.label}
    </label>
  );
}
