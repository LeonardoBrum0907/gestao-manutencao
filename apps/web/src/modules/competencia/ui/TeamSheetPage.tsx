import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MEMBER_SHIFT_LABELS, TEAM_MATRIX_VIEW_LABELS, type MemberShift, type TeamMatrixDto } from "@manutencao/shared";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { NavTrail } from "../../../design/ui/nav-trail";
import { usePreviewZoom, ZoomControls } from "../../../design/ui/sheet-preview";
import { errorMessage } from "../../../app/http";
import { useTeamMatrix } from "../data/matrix";
import { teamGrid, type TeamGrid } from "../model/team-grid";
import { teamKpis, trainingNeeds } from "../model/team-insights";
import { readTeamSearch } from "../model/team-search";
import { TeamSheetGrid } from "./team/TeamSheetGrid";
import "../../../design/ui/report.css";
import "./team-sheet.css";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function Kpis({ team }: { team: TeamMatrixDto }) {
  const kpis = teamKpis(team);
  const items: [string, string][] = [
    [`${kpis.covered}/${kpis.total}`, "equipamentos com o mínimo"],
    [String(kpis.none), "sem ninguém qualificado"],
    [String(kpis.short), "abaixo do mínimo"],
    [String(kpis.single), "ponto único"],
    [String(kpis.pdiLate), "técnicos com PDI atrasado"],
  ];
  return (
    <div className="kpis">
      {items.map(([value, label]) => (
        <div key={label} className="kpi">
          <b>{value}</b>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

function Training({ team }: { team: TeamMatrixDto }) {
  const needs = trainingNeeds(team);
  if (!needs.length) return <p className="muted">Nenhum equipamento em risco: todos têm o mínimo de qualificados.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Equipamento em risco</th>
          <th className="n">Qualificados</th>
          <th>Mais perto do corte</th>
        </tr>
      </thead>
      <tbody>
        {needs.map((need) => (
          <tr key={need.equipmentId}>
            <td>
              <b>{need.name}</b>
            </td>
            <td className="n">
              {need.qualified}
              {need.minQualified ? ` / ${need.minQualified}` : ""}
            </td>
            <td>{need.candidates.map((candidate) => `${candidate.name} (${candidate.adherence}%, falta ${candidate.gap})`).join(" · ") || "Ninguém com o equipamento na matriz"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function subtitle(team: TeamMatrixDto, grid: TeamGrid, shift: string): string {
  const shiftText = shift ? (MEMBER_SHIFT_LABELS[shift as MemberShift] ?? shift) : "todos os turnos";
  return `Visão ${TEAM_MATRIX_VIEW_LABELS[team.layout.view]} · ${shiftText} · ${grid.memberCount} técnico(s) · qualificado com ${team.qualifiedAdherence}% ou mais`;
}

function Sheet({ team, search }: { team: TeamMatrixDto; search: URLSearchParams }) {
  const state = readTeamSearch(search, team.layout.view);
  const grid = teamGrid(team, { layout: team.layout, ...state });
  const today = dateFormat.format(new Date());
  return (
    <article className="report team-sheet" data-theme="light">
      <header className="hero">
        <div>
          <p className="brand">Gestão de Manutenção · Matriz da equipe</p>
          <h1>Matriz da equipe</h1>
          <p className="sub">{subtitle(team, grid, state.shift)}</p>
        </div>
        <div className="meta">
          <b>{today}</b>
          Aderência por equipamento
        </div>
      </header>
      <div className="stripe" />
      <div className="content">
        <Kpis team={team} />
        <h2>Grade</h2>
        <TeamSheetGrid team={team} grid={grid} view={team.layout.view} />
        <h2>Quem treinar primeiro</h2>
        <Training team={team} />
      </div>
      <footer>
        <span>Gestão de Manutenção · Matriz da equipe</span>
        <span>Gerado em {today}</span>
      </footer>
    </article>
  );
}

// Folha A4 deitada para a gerência: os números, a grade como está na tela (mesmos filtros, pelo endereço) e quem treinar.
export function TeamSheetPage() {
  const [search] = useSearchParams();
  const team = useTeamMatrix();
  const preview = usePreviewZoom();
  const { fit } = preview;
  const ready = Boolean(team.data);

  useEffect(() => {
    if (ready) fit();
  }, [ready, fit]);

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <NavTrail current="Folha da equipe" back={{ to: `/competencias?${search.toString()}`, label: "Matriz da equipe" }} className="" />
        <div className="flex flex-wrap items-center gap-2">
          <ZoomControls preview={preview} />
          <Button onClick={() => window.print()}>Imprimir / Salvar PDF</Button>
        </div>
      </div>
      <p className="no-print mb-3 text-xs text-muted">Esta é a folha A4 deitada como sai no PDF. Na janela de impressão, escolha “Salvar como PDF” ou mande direto para a impressora.</p>
      {team.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {team.isError ? <Notice>{errorMessage(team.error)}</Notice> : null}
      {team.data ? (
        <div ref={preview.frame} className="report-frame">
          <div className="report-zoom" style={{ zoom: preview.zoom }}>
            <div ref={preview.sheet} className="report-sheet team-sheet-frame">
              <Sheet team={team.data} search={search} />
            </div>
          </div>
        </div>
      ) : null}
      {team.data && team.data.members.length === 0 ? <Card compact className="no-print mt-3 text-sm text-muted">Nenhum técnico ativo.</Card> : null}
    </div>
  );
}
