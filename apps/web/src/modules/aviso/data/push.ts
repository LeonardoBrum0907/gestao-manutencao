import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PushConfigDto, PushDeviceDto, PushSendResultDto } from "@manutencao/shared";
import { api } from "../../../app/http";
import { subscribeThisDevice, thisDeviceSubscription, unsubscribeThisDevice } from "./push-browser";

const CONFIG_KEY = ["push-config"];
const ENDPOINT_KEY = ["push-endpoint"];

// A lista do servidor e a inscrição do navegador mudam juntas: recarrega as duas.
function invalidatePush(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: CONFIG_KEY });
  client.invalidateQueries({ queryKey: ENDPOINT_KEY });
}

/** Chave pública do servidor e aparelhos inscritos. */
export function usePushConfig() {
  return useQuery({ queryKey: CONFIG_KEY, queryFn: () => api<PushConfigDto>("/api/push/config") });
}

/** Endereço da inscrição deste aparelho (nulo se ele não aceitou avisos), para marcar "Este aparelho" na lista. */
export function useThisDeviceEndpoint() {
  return useQuery({ queryKey: ENDPOINT_KEY, queryFn: async () => (await thisDeviceSubscription())?.endpoint ?? null });
}

/** Inscreve este aparelho no navegador e grava no servidor. */
export function useSubscribeThisDevice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (publicKey: string) =>
      api<PushDeviceDto>("/api/push/devices", { method: "POST", body: JSON.stringify(await subscribeThisDevice(publicKey)) }),
    onSettled: () => invalidatePush(client),
  });
}

/** Tira um aparelho da lista; se for este, cancela também a inscrição no navegador. */
export function useRemovePushDevice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; isThisDevice: boolean }) => {
      await api(`/api/push/devices/${input.id}`, { method: "DELETE" });
      if (input.isThisDevice) await unsubscribeThisDevice();
    },
    onSettled: () => invalidatePush(client),
  });
}

/** Manda o aviso de teste para todos os aparelhos inscritos. */
export function useSendTestPush() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<PushSendResultDto>("/api/push/test", { method: "POST" }),
    onSettled: () => client.invalidateQueries({ queryKey: CONFIG_KEY }),
  });
}
