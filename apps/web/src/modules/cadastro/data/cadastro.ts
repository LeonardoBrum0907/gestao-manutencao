import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FactoryDto, LineDto, MachineDto, MemberDto, MemberGradeDto, MemberRoleDto, SubassemblyDto, TeamDto } from "@manutencao/shared";
import { removeById, REFERENCE_DATA, upsertByName } from "../../../app/cache";
import { api } from "../../../app/http";

export function useFactories() {
  return useQuery({
    queryKey: ["factories"],
    ...REFERENCE_DATA,
    queryFn: () => api<FactoryDto[]>("/api/factories"),
  });
}

export function useSaveFactory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id
        ? api<FactoryDto>(`/api/factories/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name }),
          })
        : api<FactoryDto>("/api/factories", { method: "POST", body: JSON.stringify({ name: input.name }) }),
    onSuccess: (factory) => upsertByName(client, ["factories"], factory),
  });
}

export function useDeleteFactory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/factories/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<FactoryDto>(client, ["factories"], id),
  });
}

export function useLines() {
  return useQuery({
    queryKey: ["lines"],
    ...REFERENCE_DATA,
    queryFn: () => api<LineDto[]>("/api/lines"),
  });
}

export function useSaveLine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: Omit<LineDto, "id"> }) =>
      input.id
        ? api<LineDto>(`/api/lines/${input.id}`, { method: "PATCH", body: JSON.stringify(input.body) })
        : api<LineDto>("/api/lines", { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: (line) => upsertByName(client, ["lines"], line),
  });
}

export function useDeleteLine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/lines/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<LineDto>(client, ["lines"], id),
  });
}

export function useMachines() {
  return useQuery({
    queryKey: ["machines"],
    ...REFERENCE_DATA,
    queryFn: () => api<MachineDto[]>("/api/machines"),
  });
}

export function useSaveMachine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: Omit<MachineDto, "id"> }) =>
      input.id
        ? api<MachineDto>(`/api/machines/${input.id}`, { method: "PATCH", body: JSON.stringify(input.body) })
        : api<MachineDto>("/api/machines", { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: (machine) => upsertByName(client, ["machines"], machine),
  });
}

export function useDeleteMachine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/machines/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<MachineDto>(client, ["machines"], id),
  });
}

// Subconjuntos na ordem do cadastro dentro de cada modelo de equipamento.
export function useSubassemblies() {
  return useQuery({
    queryKey: ["subassemblies"],
    ...REFERENCE_DATA,
    queryFn: () => api<SubassemblyDto[]>("/api/subassemblies"),
  });
}

export function useSaveSubassembly() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; equipmentId: string; name: string; archived: boolean }) =>
      input.id
        ? api<SubassemblyDto>(`/api/subassemblies/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name, archived: input.archived }),
          })
        : api<SubassemblyDto>("/api/subassemblies", {
            method: "POST",
            body: JSON.stringify({ equipmentId: input.equipmentId, name: input.name }),
          }),
    onSuccess: (item) =>
      client.setQueryData<SubassemblyDto[]>(["subassemblies"], (list) =>
        list?.some((current) => current.id === item.id)
          ? list.map((current) => (current.id === item.id ? item : current))
          : list && [...list, item],
      ),
  });
}

export function useDeleteSubassembly() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/subassemblies/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<SubassemblyDto>(client, ["subassemblies"], id),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    ...REFERENCE_DATA,
    queryFn: () => api<MemberRoleDto[]>("/api/member-roles"),
  });
}

export function useSaveRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id
        ? api<MemberRoleDto>(`/api/member-roles/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name }),
          })
        : api<MemberRoleDto>("/api/member-roles", {
            method: "POST",
            body: JSON.stringify({ name: input.name }),
          }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["roles"] });
      client.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/member-roles/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<MemberRoleDto>(client, ["roles"], id),
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
    ...REFERENCE_DATA,
    queryFn: () => api<MemberGradeDto[]>("/api/member-grades"),
  });
}

export function useSaveGrade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id
        ? api<MemberGradeDto>(`/api/member-grades/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name }),
          })
        : api<MemberGradeDto>("/api/member-grades", {
            method: "POST",
            body: JSON.stringify({ name: input.name }),
          }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["grades"] });
      client.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteGrade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/member-grades/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => removeById<MemberGradeDto>(client, ["grades"], id),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: () => api<MemberDto[]>("/api/members"),
  });
}

export type MemberWrite = {
  name: string;
  position: MemberDto["position"];
  teamId: string | null;
  roleId: string | null;
  gradeId: string | null;
  shift: MemberDto["shift"];
  area: string | null;
  status: MemberDto["status"];
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

export function useSaveMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: MemberWrite }) =>
      input.id
        ? api<MemberDto>(`/api/members/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify(input.body),
          })
        : api<MemberDto>("/api/members", { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: (member) => {
      // A equipe só mostra o colaborador por id, nome do supervisor e membros: mexeu em algo disso, recarrega.
      const before = client.getQueryData<MemberDto[]>(["members"])?.find((item) => item.id === member.id);
      upsertByName(client, ["members"], member);
      if (!before || before.teamId !== member.teamId || before.name !== member.name || before.position !== member.position) {
        void client.invalidateQueries({ queryKey: ["teams"] });
      }
    },
  });
}

export function useDeleteMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/members/${id}`, { method: "DELETE" }),
    onSuccess: (_result, id) => {
      const before = client.getQueryData<MemberDto[]>(["members"])?.find((item) => item.id === id);
      removeById<MemberDto>(client, ["members"], id);
      if (!before || before.teamId) void client.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

// Equipe e colaborador se mostram um ao outro (membros, supervisor, nome da equipe): muda um, recarrega os dois.
function invalidatePeople(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: ["members"] });
  client.invalidateQueries({ queryKey: ["teams"] });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: () => api<TeamDto[]>("/api/teams"),
  });
}

export type TeamWrite = {
  name: string;
  description: string | null;
  supervisorId: string | null;
};

export function useSaveTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: TeamWrite }) =>
      input.id
        ? api<TeamDto>(`/api/teams/${input.id}`, { method: "PATCH", body: JSON.stringify(input.body) })
        : api<TeamDto>("/api/teams", { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: (team) => {
      const before = client.getQueryData<TeamDto[]>(["teams"])?.find((item) => item.id === team.id);
      upsertByName(client, ["teams"], team);
      // O colaborador mostra o nome da equipe: só recarrega se o nome mudou.
      if (before && before.name !== team.name) void client.invalidateQueries({ queryKey: ["members"] });
    },
  });
}

export function useDeleteTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/teams/${id}`, { method: "DELETE" }),
    // Só se apaga equipe sem membros, então nenhum colaborador muda.
    onSuccess: (_result, id) => removeById<TeamDto>(client, ["teams"], id),
  });
}

export function useTeamMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { teamId: string; memberId: string; action: "add" | "remove" }) =>
      api(`/api/teams/${input.teamId}/members/${input.memberId}`, { method: input.action === "add" ? "PUT" : "DELETE" }),
    onSuccess: () => invalidatePeople(client),
  });
}
