import { useNavigate } from "react-router-dom";
import { SectionPickerModal } from "../../../design/ui/section-picker";
import { ATTENTION_SHEET_SECTIONS, attentionSheetPath, defaultAttentionSections } from "../model/attention-sheet-sections";

type AttentionSheetOptionsProps = { machineId: string; recordId: string | null; onClose: () => void };

/**
 * Janela de exportar a folha de pós-preventiva (da máquina ou de uma ficha só), no padrão das outras folhas A4:
 * escolhe as linhas de cada ponto e a conferência; o cabeçalho aparece sempre.
 * @example <AttentionSheetOptions machineId={machine.id} recordId={null} onClose={() => setPicking(false)} />
 */
export function AttentionSheetOptions({ machineId, recordId, onClose }: AttentionSheetOptionsProps) {
  const navigate = useNavigate();
  return (
    <SectionPickerModal
      title={recordId ? "Exportar ficha (PDF)" : "Exportar folha (PDF)"}
      intro="Escolha o que entra na folha. O cabeçalho aparece sempre."
      allLabel="Folha completa"
      confirmLabel="Gerar folha"
      sections={ATTENTION_SHEET_SECTIONS}
      initial={defaultAttentionSections(Boolean(recordId))}
      onConfirm={(selected) => navigate(attentionSheetPath(machineId, recordId, selected))}
      onClose={onClose}
    />
  );
}
