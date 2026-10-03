import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FactoryDto, MachineDto, TechnicianDto, TechnicianGradeDto, TechnicianRoleDto } from "@manutencao/shared";
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
    queryFn: () => api<TechnicianRoleDto[]>("/api/technician-roles"),
  });
}

export function useSaveRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id
        ? api<TechnicianRoleDto>(`/api/technician-roles/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name }),
          })
        : api<TechnicianRoleDto>("/api/technician-roles", {
            method: "POST",
            body: JSON.stringify({ name: input.name }),
          }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["roles"] });
      client.invalidateQueries({ queryKey: ["technicians"] });
    },
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ["grades"],
    queryFn: () => api<TechnicianGradeDto[]>("/api/technician-grades"),
  });
}

export function useSaveGrade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id
        ? api<TechnicianGradeDto>(`/api/technician-grades/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: input.name }),
          })
        : api<TechnicianGradeDto>("/api/technician-grades", {
            method: "POST",
            body: JSON.stringify({ name: input.name }),
          }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["grades"] });
      client.invalidateQueries({ queryKey: ["technicians"] });
    },
  });
}

export function useDeleteGrade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/technician-grades/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["grades"] }),
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: () => api<TechnicianDto[]>("/api/technicians"),
  });
}

export type TechnicianWrite = {
  name: string;
  roleId: string;
  gradeId: string | null;
  shift: TechnicianDto["shift"];
  area: string | null;
  status: TechnicianDto["status"];
  registration: string | null;
  contact: string | null;
  notes: string | null;
};

export function useSaveTechnician() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: TechnicianWrite }) =>
      input.id
        ? api<TechnicianDto>(`/api/technicians/${input.id}`, {
            method: "PATCH",
            body: JSON.stringify(input.body),
          })
        : api<TechnicianDto>("/api/technicians", { method: "POST", body: JSON.stringify(input.body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["technicians"] }),
  });
}

export function useDeleteTechnician() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/technicians/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["technicians"] }),
  });
}
