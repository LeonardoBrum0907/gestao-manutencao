import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionDto } from "@manutencao/shared";
import { api } from "../../app/http";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const response = await fetch("/api/session", { credentials: "include" });
      if (response.status === 401) return null;
      if (!response.ok) throw new Error("Não foi possível ler a sessão.");
      return (await response.json()) as SessionDto;
    },
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api<SessionDto>("/api/session", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (session) => client.setQueryData(["session"], session),
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: boolean }>("/api/session", { method: "DELETE" }),
    onSuccess: () => client.setQueryData(["session"], null),
  });
}
