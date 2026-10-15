// Avisos no celular (Web Push). Só o gestor recebe; cada aparelho que aceitou fica inscrito no servidor.

/** O que a tela de Configurações › Avisos precisa saber do servidor. */
export type PushConfigDto = {
  // Chave pública do servidor para o navegador assinar a inscrição. Nula: o servidor ainda não tem as chaves.
  publicKey: string | null;
  devices: PushDeviceDto[];
};

export type PushDeviceDto = {
  id: string;
  endpoint: string;
  label: string | null;
  createdAt: string;
  lastSentAt: string | null;
};

/** Inscrição como o navegador entrega em `PushSubscription.toJSON()`, mais o rótulo do aparelho. */
export type PushSubscribeBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  label?: string | null;
};

/** Resultado de um envio para todos os aparelhos: entregues, removidos (o serviço disse que não existem mais) e falhas. */
export type PushSendResultDto = { sent: number; removed: number; failed: number };

/**
 * Botão da notificação (Android mostra até dois). O service worker chama a rota da API com a sessão do app;
 * se a chamada falhar (sessão vencida, sem rede), abre o app na `url` do aviso.
 */
export type PushAction = {
  action: string;
  title: string;
  method: "POST" | "PATCH";
  // Sempre uma rota /api/ do próprio app.
  path: string;
  body?: Record<string, string>;
};

/** Conteúdo de um aviso. `url` é a tela que abre ao tocar; `tag` faz um aviso novo substituir o anterior igual. */
export type PushMessage = {
  title: string;
  body: string;
  url: string;
  tag: string;
  actions?: PushAction[];
};
