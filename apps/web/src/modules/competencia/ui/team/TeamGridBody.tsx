import type { TeamEquipmentDto, TeamMatrixDto, TeamMatrixView, TeamMemberDto } from "@manutencao/shared";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { GridPicker } from "../../../repasse/ui/use-quick-transfer";
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

type CellProps = { member: TeamMemberDto; column: TeamColumn; team: TeamMatrixDto; view: TeamMatrixView; picker: GridPicker | null };

const pickClass = "w-full cursor-pointer transition hover:ring-2 hover:ring-inset hover:ring-accent";

// No repasse rápido a célula escolhe a pessoa e o equipamento da coluna, em vez de abrir a matriz do técnico.
function PickCell({ picker, memberId, equipmentId, label, className, children }: { picker: GridPicker; memberId: string; equipmentId: string; label: string; className: string; children: ReactNode }) {
  return (
    <td className="border-t border-line px-1 py-1 text-center">
      <button type="button" aria-label={label} onClick={() => picker.pick({ memberId, equipmentId })} className={`${className} ${pickClass}`}>
        {children}
      </button>
    </td>
  );
}

function CellContent({ cell, tone, view }: { cell: NonNullable<ReturnType<typeof cellOf>>; tone: CellTone; view: TeamMatrixView }) {
  if (view === "schedule") return <span className="text-base leading-none">{tone === "qualified" ? "✓" : "–"}</span>;
  return (
    <>
      {cell.adherence === null ? "—" : `${cell.adherence}%`}
      {view === "training" ? <ScoreStack counts={cell} className="w-full !h-1.5" /> : null}
    </>
  );
}

function MatrixCell({ member, column, team, view, picker }: CellProps) {
  const cell = cellOf(member, column.equipmentId);
  if (!cell && picker) {
    return (
      <PickCell picker={picker} memberId={member.id} equipmentId={column.equipmentId} label={`${member.name} em ${column.label}: fora da matriz`} className="flex min-h-9 items-center justify-center rounded-control text-muted">
        ·
      </PickCell>
    );
  }
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
  const label = `${member.name} em ${column.label}: ${cell.adherence === null ? "sem nota" : `${cell.adherence}%`}, ${stackTitle(cell)}`;
  const box = `flex min-h-9 flex-col items-center justify-center gap-1.5 rounded-control px-2 py-1.5 text-sm font-semibold tabular-nums ${color}`;
  if (picker) {
    return (
      <PickCell picker={picker} memberId={member.id} equipmentId={column.equipmentId} label={label} className={box}>
        <CellContent cell={cell} tone={tone} view={view} />
      </PickCell>
    );
  }
  return (
    <td className="border-t border-line px-1 py-1 text-center">
      <Link
        to={`/cadastro/colaboradores/${member.id}/matriz?equipamento=${encodeURIComponent(column.equipmentId)}`}
        aria-label={label}
        title={stackTitle(cell)}
        className={`${box} transition hover:ring-2 hover:ring-inset hover:ring-accent`}
      >
        <CellContent cell={cell} tone={tone} view={view} />
      </Link>
    </td>
  );
}

function MemberName({ member, picker }: { member: TeamMemberDto; picker: GridPicker | null }) {
  if (!picker) {
    return (
      <Link to={`/cadastro/colaboradores/${member.id}/matriz`} className="hover:text-accent hover:underline">
        {member.name}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => picker.pick({ memberId: member.id, equipmentId: null })} className="text-left font-medium text-accent hover:underline">
      {member.name}
    </button>
  );
}

type RowProps = { member: TeamMemberDto; columns: TeamColumn[]; team: TeamMatrixDto; view: TeamMatrixView; subtitle: string; picker: GridPicker | null };

function MemberRow({ member, columns, team, view, subtitle, picker }: RowProps) {
  // Quem ensina, já escolhido no repasse rápido, fica destacado até o segundo clique.
  const teaching = picker?.teacherId === member.id;
  return (
    <tr className={teaching ? "outline outline-2 -outline-offset-2 outline-accent" : undefined}>
      <th scope="row" className={`${stickyHead} min-w-[11rem] max-w-[15rem] border-t border-line px-4 py-1.5 text-left font-medium text-app ${teaching ? "!bg-accent-soft" : ""}`}>
        <MemberName member={member} picker={picker} />
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
        <MatrixCell key={column.id} member={member} column={column} team={team} view={view} picker={picker} />
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

type BodyProps = { team: TeamMatrixDto; columns: TeamColumn[]; rowBlocks: TeamRowBlock[]; view: TeamMatrixView; picker: GridPicker | null };

export function TeamGridBody({ team, columns, rowBlocks, view, picker }: BodyProps) {
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
        ...block.members.map((member) => <MemberRow key={member.id} member={member} columns={columns} team={team} view={view} subtitle={memberSubtitle(member, block)} picker={picker} />),
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
