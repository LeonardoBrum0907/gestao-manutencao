import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal } from "../../../design/ui/controls";
import { reportPath, reportSectionsFor, type ReportSectionKey } from "../model/report";

// Escolha das seções do relatório; abre sempre com todas marcadas (relatório geral).
export function ReportOptionsModal({ memberId, isTechnician, onClose }: { memberId: string; isTechnician: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const sections = reportSectionsFor(isTechnician);
  const [selected, setSelected] = useState<ReportSectionKey[]>(sections.map((section) => section.key));
  const toggle = (key: ReportSectionKey) =>
    setSelected((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const ordered = sections.map((section) => section.key).filter((key) => selected.includes(key));
  return (
    <Modal open title="Relatório PDF" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">
        Escolha o que entra no relatório. Com tudo marcado, é o relatório geral. O cabeçalho aparece sempre.
      </p>
      <div className="mb-3 flex gap-3 text-sm font-medium text-accent">
        <button type="button" className="hover:underline" onClick={() => setSelected(sections.map((section) => section.key))}>
          Relatório geral
        </button>
        <button type="button" className="hover:underline" onClick={() => setSelected([])}>
          Limpar
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {sections.map((section) => (
          <li key={section.key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-control border border-line px-3 py-2.5 text-sm text-app transition hover:bg-accent-soft">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--accent)]"
                checked={selected.includes(section.key)}
                onChange={() => toggle(section.key)}
              />
              {section.label}
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button tone="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button disabled={ordered.length === 0} onClick={() => navigate(reportPath(memberId, ordered, isTechnician))}>
          Gerar relatório
        </Button>
      </div>
    </Modal>
  );
}
