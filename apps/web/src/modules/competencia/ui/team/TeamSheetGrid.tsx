import type { TeamMatrixDto, TeamMatrixView, TeamMemberDto } from "@manutencao/shared";
import type { TeamColumn } from "../../model/team-columns";
import type { TeamGrid } from "../../model/team-grid";
import { cellTone, type CellTone } from "../../model/team-insights";
import { blockQualified, cellOf, qualifiedCount, type TeamRowBlock } from "../../model/team-rows";

// A partir daqui o nome da coluna deita, para a grade caber na largura da folha.
const MANY_COLUMNS = 14;

const toneCell: Record<CellTone, string> = { qualified: "q", near: "near", below: "below", unscored: "none" };

function SheetCell({ member, column, team, view }: { member: TeamMemberDto; column: TeamColumn; team: TeamMatrixDto; view: TeamMatrixView }) {
  const cell = cellOf(member, column.equipmentId);
  if (!cell) return <td className="none">·</td>;
  const tone = cellTone(cell.adherence, cell.scored, team.qualifiedAdherence, view);
  if (view === "schedule") return <td className={tone === "qualified" ? "q" : "none"}>{tone === "qualified" ? "✓" : "–"}</td>;
  return <td className={toneCell[tone]}>{cell.adherence === null ? "—" : `${cell.adherence}%`}</td>;
}

function Head({ team, grid }: { team: TeamMatrixDto; grid: TeamGrid }) {
  const coverage = new Map(team.equipments.map((equipment) => [equipment.id, equipment]));
  return (
    <thead>
      {grid.columnBlocks.some((block) => block.label) ? (
        <tr className="blocks">
          <th className="who" />
          {grid.columnBlocks.map((block) => (
            <th key={block.id ?? "modelos"} colSpan={block.columns.length}>
              {block.label}
            </th>
          ))}
          <th />
        </tr>
      ) : null}
      <tr className="cols">
        <th className="who">Técnico</th>
        {grid.columns.map((column) => {
          const equipment = coverage.get(column.equipmentId);
          return (
            <th key={column.id}>
              <span className="name">{column.label}</span>
              {equipment ? <span className="min">{equipment.qualified}{equipment.minQualified ? `/${equipment.minQualified}` : ""}</span> : null}
            </th>
          );
        })}
        <th>Qualif.</th>
      </tr>
    </thead>
  );
}

function SubtotalRow({ block, grid, cut }: { block: TeamRowBlock; grid: TeamGrid; cut: number }) {
  return (
    <tr className="subtotal">
      <td className="who">Qualificados · {block.label}</td>
      {grid.columns.map((column) => {
        const count = blockQualified(block.members, column.equipmentId, cut);
        return (
          <td key={column.id} className={count ? "" : "zero"}>
            {count}
          </td>
        );
      })}
      <td />
    </tr>
  );
}

function MemberRow({ member, grid, team, view }: { member: TeamMemberDto; grid: TeamGrid; team: TeamMatrixDto; view: TeamMatrixView }) {
  return (
    <tr>
      <td className="who">
        <b>{member.name}</b>
      </td>
      {grid.columns.map((column) => (
        <SheetCell key={column.id} member={member} column={column} team={team} view={view} />
      ))}
      <td>{qualifiedCount(member, team.qualifiedAdherence)}</td>
    </tr>
  );
}

function SheetLegend({ cut, view }: { cut: number; view: TeamMatrixView }) {
  return (
    <p className="legend">
      <span>Negrito em verde: qualificado ({cut}% ou mais)</span>
      {view === "training" ? <span>Contorno tracejado: perto do corte</span> : null}
      <span>· não opera o equipamento</span>
      <span>Embaixo do nome: qualificados / mínimo</span>
    </p>
  );
}

export type SheetGridParts = { subtotals: boolean; legend: boolean };

// Grade da folha A4: as mesmas colunas, blocos e técnicos da tela, em tamanho de papel. Legível em preto e branco
// (qualificado em negrito, perto do corte com contorno tracejado). Subtotais e legenda saem se o gestor pedir.
export function TeamSheetGrid({ team, grid, view, parts }: { team: TeamMatrixDto; grid: TeamGrid; view: TeamMatrixView; parts: SheetGridParts }) {
  const width = grid.columns.length + 2;
  return (
    <>
      <table className={`grid-sheet ${grid.columns.length >= MANY_COLUMNS ? "many" : ""}`}>
        <Head team={team} grid={grid} />
        <tbody>
          {grid.rowBlocks.flatMap((block) => [
            block.label ? (
              <tr key={`g-${block.label}`} className="group">
                <td colSpan={width}>
                  {block.label} · {block.members.length}
                </td>
              </tr>
            ) : null,
            ...block.members.map((member) => <MemberRow key={member.id} member={member} grid={grid} team={team} view={view} />),
            block.label && parts.subtotals ? <SubtotalRow key={`s-${block.label}`} block={block} grid={grid} cut={team.qualifiedAdherence} /> : null,
          ])}
        </tbody>
      </table>
      {parts.legend ? <SheetLegend cut={team.qualifiedAdherence} view={view} /> : null}
    </>
  );
}
