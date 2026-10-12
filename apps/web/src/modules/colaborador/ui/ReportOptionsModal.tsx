import { useNavigate } from "react-router-dom";
import { SectionPickerModal } from "../../../design/ui/section-picker";
import { reportPath, reportSectionsFor } from "../model/report";

// Escolha das seções do relatório; abre sempre com todas marcadas (relatório geral).
export function ReportOptionsModal({ memberId, isTechnician, onClose }: { memberId: string; isTechnician: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <SectionPickerModal
      title="Relatório PDF"
      intro="Escolha o que entra no relatório. Com tudo marcado, é o relatório geral. O cabeçalho aparece sempre."
      allLabel="Relatório geral"
      confirmLabel="Gerar relatório"
      sections={reportSectionsFor(isTechnician)}
      onConfirm={(selected) => navigate(reportPath(memberId, selected, isTechnician))}
      onClose={onClose}
    />
  );
}
