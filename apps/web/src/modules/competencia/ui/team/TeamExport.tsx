import type { TeamMatrixDto } from "@manutencao/shared";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../../design/ui/controls";
import { SectionPickerModal } from "../../../../design/ui/section-picker";
import { useToast } from "../../../../design/ui/toast";
import { downloadTeamWorkbook } from "../../data/team-xlsx";
import type { TeamGrid } from "../../model/team-grid";
import { teamMatrixTab, teamTrainingTab } from "../../model/team-sheet";
import { TEAM_SHEET_SECTIONS, teamSheetPath } from "../../model/team-sheet-sections";
import type { TeamControls } from "./use-team-controls";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Exportar o que está na tela: planilha com a grade e a lista de quem treinar, ou a folha A4 deitada para PDF
// (abre antes a janela para escolher as partes da folha).
export function TeamExport({ team, grid, controls }: { team: TeamMatrixDto; grid: TeamGrid; controls: TeamControls }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);

  async function downloadSheet() {
    setBusy(true);
    try {
      const now = new Date();
      await downloadTeamWorkbook([teamMatrixTab(team, grid, controls.layout.view, dayFormat.format(now), controls.category), teamTrainingTab(team)], `matriz-da-equipe-${isoDay(now)}.xlsx`);
    } catch {
      toast({ text: "Não foi possível gerar a planilha. Tente de novo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button tone="ghost" onClick={downloadSheet} disabled={busy}>
        {busy ? "Gerando…" : "Planilha (Excel)"}
      </Button>
      <Button onClick={() => setPicking(true)}>Folha A4 (PDF)</Button>
      {picking ? <SheetOptions controls={controls} onClose={() => setPicking(false)} /> : null}
    </>
  );
}

// Janela igual à do Relatório PDF do colaborador: escolhe as partes da folha; os filtros da tela vão junto.
function SheetOptions({ controls, onClose }: { controls: TeamControls; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <SectionPickerModal
      title="Folha A4 (PDF)"
      intro="Escolha o que entra na folha. A grade sai como está na tela (visão, filtros e ordem). O cabeçalho aparece sempre."
      allLabel="Folha completa"
      confirmLabel="Gerar folha"
      sections={TEAM_SHEET_SECTIONS}
      onConfirm={(selected) => navigate(teamSheetPath(controls.search, selected))}
      onClose={onClose}
    />
  );
}
