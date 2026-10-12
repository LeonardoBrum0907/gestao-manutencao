import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  COMPETENCY_LEVEL_EXPECTED,
  DEFAULT_TEAM_MATRIX_LAYOUT,
  type CompetencyScore,
  type MemberMatrixDto,
  type TeamMatrixDto,
  type TeamMatrixLayoutDto,
  type TeamMemberDto,
} from "@manutencao/shared";
import { api } from "../../../app/http";

export type SkillWrite = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

/**
 * Busca a matriz do técnico. Uma API anterior ao esperado por grau (PR #40) não manda gradeName nem
 * expectedByLevel: aí vale o esperado da dificuldade, para a tela não quebrar enquanto o servidor não é atualizado.
 * @example memberMatrix(`/api/members/${memberId}/matrix`)
 */
export async function memberMatrix(path: string, init?: RequestInit): Promise<MemberMatrixDto> {
  const matrix = await api<Partial<MemberMatrixDto> & Omit<MemberMatrixDto, "gradeName" | "expectedByLevel">>(path, init);
  return { ...matrix, gradeName: matrix.gradeName ?? null, expectedByLevel: matrix.expectedByLevel ?? COMPETENCY_LEVEL_EXPECTED };
}

export function useMatrix(memberId: string | undefined) {
  return useQuery({
    queryKey: ["matrix", memberId],
    queryFn: () => memberMatrix(`/api/members/${memberId}/matrix`),
    enabled: Boolean(memberId),
  });
}

type OlderTeamMatrix = Omit<TeamMatrixDto, "lines" | "layout" | "members"> &
  Partial<Pick<TeamMatrixDto, "lines" | "layout">> & { members: (Omit<TeamMemberDto, "gradeName" | "teamName"> & Partial<TeamMemberDto>)[] };

/**
 * Busca a matriz da equipe. A tela publica na Vercel antes do deploy da API no PC: uma API anterior às linhas e à
 * disposição salva não manda lines, layout, gradeName nem teamName, e aí valem os padrões (vazio e a disposição padrão).
 * @example teamMatrix() // { equipments, members, lines, layout, qualifiedAdherence }
 */
export async function teamMatrix(): Promise<TeamMatrixDto> {
  const team = await api<OlderTeamMatrix>("/api/team-matrix");
  return {
    ...team,
    lines: team.lines ?? [],
    layout: team.layout ?? DEFAULT_TEAM_MATRIX_LAYOUT,
    members: team.members.map((member) => ({ ...member, gradeName: member.gradeName ?? null, teamName: member.teamName ?? null })),
  };
}

export function useTeamMatrix() {
  return useQuery({ queryKey: ["team-matrix"], queryFn: teamMatrix });
}

// Cada mudança de visão, agrupamento ou coluna arrastada grava a disposição inteira. A tela muda na hora;
// se a gravação falhar, volta ao que o servidor tem.
export function useSaveTeamLayout() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: "team-matrix-layout" },
    mutationFn: (layout: TeamMatrixLayoutDto) => api<TeamMatrixLayoutDto>("/api/team-matrix/layout", { method: "PUT", body: JSON.stringify(layout) }),
    onMutate: (layout) => client.setQueryData<TeamMatrixDto>(["team-matrix"], (team) => (team ? { ...team, layout } : team)),
    onError: () => client.invalidateQueries({ queryKey: ["team-matrix"] }),
  });
}

export function useSetMatrixEquipments(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (equipments: string[]) =>
      memberMatrix(`/api/members/${memberId}/matrix/equipments`, {
        method: "PUT",
        body: JSON.stringify({ equipments }),
      }),
    onSuccess: (matrix) => {
      client.setQueryData(["matrix", memberId], matrix);
      client.invalidateQueries({ queryKey: ["team-matrix"] });
    },
  });
}

// As notas do técnico saem em fila (uma por vez, na ordem em que foram marcadas): marcar rápido, pelo teclado,
// não deixa uma resposta antiga sobrescrever uma mais nova. A tela já mostra a nota na hora.
const skillScope = (memberId: string) => ({ id: `matrix-skills-${memberId}` });
const skillKey = (memberId: string) => ["matrix-skill-write", memberId];

function applyOptimistic(client: ReturnType<typeof useQueryClient>, memberId: string, writes: SkillWrite[]) {
  client.setQueryData<MemberMatrixDto>(["matrix", memberId], (previous) => {
    if (!previous) return previous;
    const changed = new Set(writes.map((write) => write.skillId));
    const kept = writes
      .filter((write) => write.score !== null || write.notApplicable || write.expected !== null)
      .map(({ skillId, score, notApplicable, expected }) => ({ skillId, score, notApplicable, expected }));
    return { ...previous, entries: [...previous.entries.filter((entry) => !changed.has(entry.skillId)), ...kept] };
  });
}

function useSkillWrite<TInput>(memberId: string, request: (input: TInput) => Promise<MemberMatrixDto>, optimistic: (input: TInput) => SkillWrite[]) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: skillKey(memberId),
    scope: skillScope(memberId),
    mutationFn: request,
    // Falhou: volta ao que o servidor tem.
    onError: () => client.invalidateQueries({ queryKey: ["matrix", memberId] }),
    onSuccess: (matrix) => {
      // Só a última resposta da fila vale (as anteriores já estão desatualizadas na tela).
      if (client.isMutating({ mutationKey: skillKey(memberId) }) > 1) return;
      client.setQueryData(["matrix", memberId], matrix);
      client.invalidateQueries({ queryKey: ["team-matrix"] });
    },
  });
  return {
    ...mutation,
    mutate: (input: TInput) => {
      applyOptimistic(client, memberId, optimistic(input));
      mutation.mutate(input);
    },
  };
}

export function useSetSkill(memberId: string) {
  return useSkillWrite<SkillWrite>(
    memberId,
    ({ skillId, ...body }) =>
      memberMatrix(`/api/members/${memberId}/matrix/skills/${skillId}`, { method: "PUT", body: JSON.stringify(body) }),
    (write) => [write],
  );
}

// Vários de uma vez (marcar um subconjunto ou o equipamento inteiro como "atende o esperado").
export function useSetSkills(memberId: string) {
  return useSkillWrite<SkillWrite[]>(
    memberId,
    (entries) => memberMatrix(`/api/members/${memberId}/matrix/skills`, { method: "PUT", body: JSON.stringify({ entries }) }),
    (writes) => writes,
  );
}
