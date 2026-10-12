import type { TeamEquipmentDto, TeamMatrixDto, TeamMatrixView, TeamMemberDto } from "@manutencao/shared";
import { Link } from "react-router-dom";
import type { TeamColumn } from "../../model/team-columns";
import { cellTone, type CellTone } from "../../model/team-insights";
import { blockQualified, cellOf, qualifiedCount, shiftLabel, type TeamRowBlock } from "../../model/team-rows";
import { ScoreStack, stackTitle } from "../ScoreStack";
import { CoverageChip } from "./TeamGridHead";

const toneClass: Record<CellTone, string> = {
  qualified: "bg-accent-soft text-accent-ink",
  near: "bg-warn-soft text-warn outline-dashed outline-2 -outline-offset-2 outline-warn",
  below: "bg-danger-soft text-danger",
  unscored: "bg-chip text-muted",
};

const stickyHead = "sticky left-0 z-[2] bg-card";

type CellProps = { member: TeamMemberDto; column: TeamColumn; team: TeamMatrixDto; view: TeamMatrixView };

function CellContent({ cell, tone, view }: { cell: NonNullable<ReturnType<typeof cellOf>>; tone: CellTone; view: TeamMatrixView }) {
  if (view === "schedule") return <span className="text-base leading-none">{tone === "qualified" ? "✓" : "–"}</span>;
  return (
    <>
      {cell.adherence === null ? "—" : `${cell.adherence}%`}
      {view === "training" ? <ScoreStack counts={cell} className="w-full !h-1.5" /> : null}
    </>
  );
}

function MatrixCell({ member, column, team, view }: CellProps) {
  const cell = cellOf(member, column.equipmentId);
  if (!cell) {
    return (
      <td className="border-t border-line px-1 py-1 text-center text-muted" title="Equipamento não marcado na matriz do técnico">
        ·
      </td>
    );
  }
  const tone = cellTone(cell.adherence, cell.scored, team.qualifiedAdherence, view);
  // Na escala o que importa é quem está qualificado: o resto fica sem cor, para o ✓ saltar aos olhos.
  const color = view === "schedule" ? (tone === "qualified" ? "text-accent font-bold" : "text-muted") : toneClass[tone];
  const faded = view === "training" && tone === "qualified" ? "opacity-60" : "";
  const label = `${member.name} em ${column.label}: ${cell.adherence === null ? "sem nota" : `${cell.adherence}%`}, ${stackTitle(cell)}`;
  return (
    <td className="border-t border-line px-1 py-1 text-center">
      <Link
        to={`/cadastro/colaboradores/${member.id}/matriz?equipamento=${encodeURIComponent(column.equipmentId)}`}
        aria-label={label}
        title={stackTitle(cell)}
        className={`flex min-h-9 flex-col items-center justify-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-semibold tabular-nums transition hover:ring-2 hover:ring-inset hover:ring-accent ${color} ${faded}`}
      >
        <CellContent cell={cell} tone={tone} view={view} />
      </Link>
    </td>
  );
}

function MemberRow({ member, columns, team, view, subtitle }: { member: TeamMemberDto; columns: TeamColumn[]; team: TeamMatrixDto; view: TeamMatrixView; subtitle: string }) {
  return (
    <tr>
      <th scope="row" className={`${stickyHead} min-w-[11rem] max-w-[15rem] border-t border-line px-4 py-1.5 text-left font-medium text-app`}>
        <Link to={`/cadastro/colaboradores/${member.id}/matriz`} className="hover:text-accent hover:underline">
          {member.name}
        </Link>
        {member.pdiOverdue ? (
          <Link to={`/cadastro/colaboradores/${member.id}/pdi`} title="Itens do PDI com prazo vencido" className="ml-1.5 rounded-full bg-danger-soft px-1.5 text-[11px] font-semibold text-danger">
            PDI {member.pdiOverdue}
          </Link>
        ) : null}
        <span className="block truncate text-xs font-normal text-muted" title={subtitle}>
          {subtitle}
        </span>
      </th>
      {columns.map((column) => (
        <MatrixCell key={column.id} member={member} column={column} team={team} view={view} />
      ))}
      <td className="whitespace-nowrap border-t border-line px-3 text-center text-xs tabular-nums text-muted">
        {qualifiedCount(member, team.qualifiedAdherence)} de {team.equipments.length}
      </td>
    </tr>
  );
}

// Subtotal do bloco: quantos do turno (ou grau, ou equipe) estão qualificados em cada coluna. Zero sai em vermelho.
function SubtotalRow({ block, columns, threshold }: { block: TeamRowBlock; columns: TeamColumn[]; threshold: number }) {
  return (
    <tr className="bg-canvas text-xs">
      <th scope="row" className="sticky left-0 z-[2] bg-canvas px-4 py-1.5 text-left font-medium text-muted">
        Qualificados · {block.label}
      </th>
      {columns.map((column) => {
        const count = blockQualified(block.members, column.equipmentId, threshold);
        return (
          <td key={column.id} className={`py-1.5 text-center font-semibold tabular-nums ${count ? "text-app" : "text-danger"}`}>
            {count}
          </td>
        );
      })}
      <td />
    </tr>
  );
}

// Embaixo do nome: turno, grau e equipe, menos o que já é o título do bloco.
function memberSubtitle(member: TeamMemberDto, block: TeamRowBlock): string {
  return [shiftLabel(member.shift), member.gradeName, member.teamName].filter((part): part is string => Boolean(part) && part !== block.label).join(" · ");
}

type BodyProps = { team: TeamMatrixDto; columns: TeamColumn[]; rowBlocks: TeamRowBlock[]; view: TeamMatrixView };

export function TeamGridBody({ team, columns, rowBlocks, view }: BodyProps) {
  const equipmentOf = new Map<string, TeamEquipmentDto>(team.equipments.map((equipment) => [equipment.id, equipment]));
  const width = columns.length + 2;
  return (
    <tbody>
      {rowBlocks.flatMap((block) => [
        block.label ? (
          <tr key={`g-${block.label}`} className="bg-group">
            <th scope="colgroup" colSpan={width} className="px-4 py-1.5 text-left text-xs font-bold tracking-[0.03em] text-app">
              <span className="sticky left-4">
                {block.label} · {block.members.length}
              </span>
            </th>
          </tr>
        ) : null,
        ...block.members.map((member) => <MemberRow key={member.id} member={member} columns={columns} team={team} view={view} subtitle={memberSubtitle(member, block)} />),
        block.label ? <SubtotalRow key={`s-${block.label}`} block={block} columns={columns} threshold={team.qualifiedAdherence} /> : null,
      ])}
      {rowBlocks.every((block) => block.members.length === 0) ? (
        <tr>
          <td colSpan={width} className="px-4 py-4 text-sm text-muted">
            Nenhum técnico ativo com esses filtros.
          </td>
        </tr>
      ) : null}
      <tr>
        <th scope="row" className={`${stickyHead} border-t-2 border-line-strong px-4 py-2 text-left text-sm font-semibold text-app`}>
          Qualificados na equipe
        </th>
        {columns.map((column) => (
          <td key={column.id} className="border-t-2 border-line-strong py-2 text-center">
            <CoverageChip equipment={equipmentOf.get(column.equipmentId)} />
          </td>
        ))}
        <td className="border-t-2 border-line-strong" />
      </tr>
    </tbody>
  );
}
