import type { TeamMatrixDto } from "@manutencao/shared";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../design/ui/controls";
import { useToast } from "../../../../design/ui/toast";
import { downloadTeamWorkbook } from "../../data/team-xlsx";
import type { TeamGrid } from "../../model/team-grid";
import { teamMatrixTab, teamTrainingTab } from "../../model/team-sheet";
import type { TeamControls } from "./use-team-controls";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const isoDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// Exportar o que está na tela: planilha com a grade e a lista de quem treinar, ou a folha A4 deitada para PDF.
export function TeamExport({ team, grid, controls }: { team: TeamMatrixDto; grid: TeamGrid; controls: TeamControls }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function downloadSheet() {
    setBusy(true);
    try {
      const now = new Date();
      await downloadTeamWorkbook([teamMatrixTab(team, grid, controls.layout.view, dayFormat.format(now)), teamTrainingTab(team)], `matriz-da-equipe-${isoDay(now)}.xlsx`);
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
      <Link
        to={`/competencias/folha?${controls.search.toString()}`}
        className="inline-flex items-center justify-center rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
      >
        Folha A4 (PDF)
      </Link>
    </>
  );
}
