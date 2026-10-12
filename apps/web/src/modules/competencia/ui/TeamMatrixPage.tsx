import { Link } from "react-router-dom";
import type { TeamMatrixDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice, PageTitle } from "../../../design/ui/controls";
import { useTeamMatrix } from "../data/matrix";
import { canDragColumns, teamGrid } from "../model/team-grid";
import { TeamExport } from "./team/TeamExport";
import { TeamGrid } from "./team/TeamGrid";
import { TeamKpis } from "./team/TeamKpis";
import { TeamLegend } from "./team/TeamLegend";
import { TeamToolbar } from "./team/TeamToolbar";
import { TeamTraining } from "./team/TeamTraining";
import { useTeamControls } from "./team/use-team-controls";

// Uma tela para três usos: decidir quem treinar, montar a escala por turno e mostrar para a gerência.
// Os números do topo filtram a grade; a visão, os agrupamentos e a ordem das colunas ficam salvos no sistema.
function TeamMatrixContent({ team }: { team: TeamMatrixDto }) {
  const controls = useTeamControls(team);
  const grid = teamGrid(team, controls);
  const draggable = canDragColumns(controls);
  return (
    <div className="flex flex-col gap-4">
      <TeamKpis team={team} focus={controls.focus} onFocus={(focus) => controls.setSearch({ focus })} />
      {controls.saveFailed ? <Notice>Não foi possível salvar a disposição da matriz. A tela voltou ao que estava salvo.</Notice> : null}
      <Card className="flex flex-col gap-4 !p-0">
        <div className="px-4 pt-4 sm:px-5">
          <TeamToolbar team={team} controls={controls} exportButtons={<TeamExport team={team} grid={grid} controls={controls} />} />
        </div>
        <TeamGrid team={team} grid={grid} controls={controls} />
        <div className="px-4 pb-4 sm:px-5">
          <TeamLegend view={controls.layout.view} cut={team.qualifiedAdherence} draggable={draggable} />
        </div>
      </Card>
      {controls.layout.view === "training" ? <TeamTraining team={team} /> : null}
      {controls.layout.columnGroup === "line" && team.lines.length === 0 ? (
        <Card compact className="text-sm text-muted">
          Nenhuma máquina com modelo cadastrada ainda: as colunas mostram os modelos.{" "}
          <Link to="/configuracoes/fabricas" className="font-medium text-accent hover:underline">
            Cadastrar máquinas nas linhas
          </Link>
        </Card>
      ) : null}
    </div>
  );
}

export function TeamMatrixPage() {
  const team = useTeamMatrix();
  return (
    <div className="flex flex-col">
      <PageTitle
        eyebrow="Equipe"
        title="Matriz da equipe"
        text={`Aderência de cada técnico por equipamento. Qualificado é aderência de ${team.data?.qualifiedAdherence ?? 80}% ou mais.`}
        action={
          <Link to="/configuracoes/avaliacao" className="text-sm font-medium text-accent hover:underline">
            Ajustar o corte e o mínimo por equipamento
          </Link>
        }
      />
      {team.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {team.isError ? <Notice>{errorMessage(team.error)}</Notice> : null}
      {team.data ? <TeamMatrixContent team={team.data} /> : null}
    </div>
  );
}
