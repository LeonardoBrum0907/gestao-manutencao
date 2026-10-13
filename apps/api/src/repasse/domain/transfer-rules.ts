import { TRANSFER_SUGGEST_BELOW_PERCENT, type TransferCandidateDto, type TransferPersonDto } from "@manutencao/shared";
import { DomainError } from "../../kernel/domain-error";

/** Colaborador com o que importa para abrir um repasse. */
export type TransferMember = TransferPersonDto & { position: string; status: string };

/**
 * Repasse é entre técnicos que estão na empresa (férias ou afastamento não impedem).
 * @example requireTechnician(await store.member(id), id).name
 */
export function requireTechnician(member: TransferMember | null, id: string): TransferMember {
  if (!member) throw new DomainError("not_found", 404, `Colaborador "${id}" não encontrado.`);
  if (member.position !== "technician" || member.status === "inactive") {
    throw new DomainError("invalid", 400, `${member.name} não é técnico ativo: o repasse é entre técnicos ativos.`);
  }
  return member;
}

/**
 * Equipamentos em foco: os pedidos, todos da matriz de quem ensina; sem pedido, a matriz inteira dele.
 * @example focusEquipments([], ["e1", "e2"], "Welligton") // ["e1", "e2"]
 */
export function focusEquipments(requested: readonly string[], teacherEquipments: readonly string[], teacherName: string): string[] {
  if (requested.length === 0) return [...teacherEquipments];
  const outside = requested.filter((id) => !teacherEquipments.includes(id));
  if (outside.length) {
    throw new DomainError("invalid", 400, `Equipamento fora da matriz de ${teacherName}: ${outside.join(", ")}. Use só equipamentos marcados na matriz dele.`);
  }
  return [...new Set(requested)];
}

/** Quem está em jogo ao abrir um repasse. */
export type NewTransferCheck = {
  teacher: TransferMember;
  learner: TransferMember;
  // Já existe repasse em andamento entre os dois (no mesmo sentido).
  pairOpen: boolean;
  mastered: number;
};

/**
 * Regras para abrir: pessoas diferentes, par ainda não aberto e quem ensina com algo a ensinar. Os dois podem
 * estar em outros repasses ao mesmo tempo (N:N).
 * @example assertNewTransfer({ teacher, learner, pairOpen: false, mastered: 46 })
 */
export function assertNewTransfer(check: NewTransferCheck): void {
  if (check.teacher.id === check.learner.id) throw new DomainError("invalid", 400, "Quem ensina e quem aprende precisam ser pessoas diferentes.");
  if (check.pairOpen) {
    throw new DomainError("conflict", 409, `${check.learner.name} já aprende com ${check.teacher.name} num repasse em andamento. Abra a tela dele em vez de criar outro.`);
  }
  if (check.mastered === 0) {
    throw new DomainError("invalid", 400, `${check.teacher.name} não tem nota 3 ou 4 nesses equipamentos: não há o que repassar.`);
  }
}

/**
 * Sugestões de quem aprende: fora quem já faz quase tudo (não teria o que aprender); quem já aprende com esta
 * pessoa vai para o fim; o resto por quem já faz mais, empate pelo nome.
 * @example rankCandidates(candidates)[0].member.name
 */
export function rankCandidates(candidates: readonly TransferCandidateDto[]): TransferCandidateDto[] {
  return candidates
    .filter((candidate) => (candidate.progress.percent ?? 0) < TRANSFER_SUGGEST_BELOW_PERCENT)
    .sort(
      (a, b) =>
        Number(a.withTeacher) - Number(b.withTeacher) ||
        b.progress.done - a.progress.done ||
        a.member.name.localeCompare(b.member.name, "pt-BR"),
    );
}
