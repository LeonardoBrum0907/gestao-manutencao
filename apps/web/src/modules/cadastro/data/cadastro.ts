import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FactoryDto, MachineDto, MemberDto, MemberGradeDto, MemberRoleDto, TeamDto } from "@manutencao/shared";
import { api } from "../../../app/http";

export function useFactories() {
  return useQuery({
    queryKey: ["factories"],
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
    onSuccess: () => client.invalidateQueries({ queryKey: ["factories"] }),
  });
}

export function useDeleteFactory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/factories/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["factories"] }),
  });
}

export function useMachines() {
  return useQuery({
    queryKey: ["machines"],
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
    onSuccess: () => client.invalidateQueries({ queryKey: ["machines"] }),
  });
}

export function useDeleteMachine() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/machines/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["machines"] }),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
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

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
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
    onSuccess: () => client.invalidateQueries({ queryKey: ["grades"] }),
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
    onSuccess: () => invalidatePeople(client),
  });
}

export function useDeleteMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/members/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidatePeople(client),
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
    onSuccess: () => invalidatePeople(client),
  });
}

export function useDeleteTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/teams/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidatePeople(client),
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
