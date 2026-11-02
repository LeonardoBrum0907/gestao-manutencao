import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MemberDto, RpDto, RpPublicLinkStateDto, RpRevisionDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { invalidateRecords } from "../../registro/data/records";

// O lado do coordenador (com login) da página pública de RPs.

export function useRpPublicLink() {
  return useQuery({ queryKey: ["rp-public-link"], queryFn: () => api<RpPublicLinkStateDto>("/api/rp-public-link") });
}

export function useReplaceRpPublicLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<RpPublicLinkStateDto>("/api/rp-public-link", { method: "POST" }),
    onSuccess: (state) => client.setQueryData(["rp-public-link"], state),
  });
}

export function useDisableRpPublicLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<RpPublicLinkStateDto>("/api/rp-public-link", { method: "DELETE" }),
    onSuccess: (state) => client.setQueryData(["rp-public-link"], state),
  });
}

// A ficha e as listas de RP mostram o conferido e a revisão: ficam velhas.
function refreshRp(client: ReturnType<typeof useQueryClient>, rp: RpDto) {
  client.setQueryData(["rp", rp.id], rp);
  void client.invalidateQueries({ queryKey: ["rp"], predicate: (query) => query.queryKey[1] !== rp.id });
}

export function useSetRpChecked(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (checked: boolean) => api<RpDto>(`/api/rp/${id}/checked`, { method: "POST", body: JSON.stringify({ checked }) }),
    onSuccess: (rp) => refreshRp(client, rp),
  });
}

export function useRpRevisions(id: string, enabled: boolean) {
  return useQuery({ queryKey: ["rp-revisions", id], queryFn: () => api<RpRevisionDto[]>(`/api/rp/${id}/revisions`), enabled });
}

export function useRestoreRpRevision(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (revisionId: string) => api<RpDto>(`/api/rp/${id}/revisions/${revisionId}/restore`, { method: "POST" }),
    onSuccess: (rp) => {
      refreshRp(client, rp);
      void client.invalidateQueries({ queryKey: ["rp-revisions", id] });
      // A tela de Chamados mostra o status do RP no chamado de origem.
      invalidateRecords(client);
    },
  });
}

export function useSetMemberPublicRp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; enabled: boolean }) =>
      api<{ id: string; publicRp: boolean }>(`/api/members/${input.memberId}/public-rp`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: input.enabled }),
      }),
    onSuccess: (result) => {
      client.setQueryData<MemberDto[]>(["members"], (list) =>
        list?.map((member) => (member.id === result.id ? { ...member, publicRp: result.publicRp } : member)),
      );
    },
  });
}
