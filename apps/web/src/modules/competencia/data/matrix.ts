import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompetencyScore, MemberMatrixDto, TeamMatrixDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export type SkillWrite = {
  skillId: string;
  score: CompetencyScore | null;
  notApplicable: boolean;
  expected: CompetencyScore | null;
};

export function useMatrix(memberId: string | undefined) {
  return useQuery({
    queryKey: ["matrix", memberId],
    queryFn: () => api<MemberMatrixDto>(`/api/members/${memberId}/matrix`),
    enabled: Boolean(memberId),
  });
}

export function useTeamMatrix() {
  return useQuery({
    queryKey: ["team-matrix"],
    queryFn: () => api<TeamMatrixDto>("/api/team-matrix"),
  });
}

export function useSetMatrixEquipments(memberId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (equipments: string[]) =>
      api<MemberMatrixDto>(`/api/members/${memberId}/matrix/equipments`, {
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
      api<MemberMatrixDto>(`/api/members/${memberId}/matrix/skills/${skillId}`, { method: "PUT", body: JSON.stringify(body) }),
    (write) => [write],
  );
}

// Vários de uma vez (marcar um subconjunto ou o equipamento inteiro como "atende o esperado").
export function useSetSkills(memberId: string) {
  return useSkillWrite<SkillWrite[]>(
    memberId,
    (entries) => api<MemberMatrixDto>(`/api/members/${memberId}/matrix/skills`, { method: "PUT", body: JSON.stringify({ entries }) }),
    (writes) => writes,
  );
}
