import { useState } from "react";
import type { PushDeviceDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, SectionTitle } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { PushBrowserError, readPushEnvironment } from "../data/push-browser";
import { usePushConfig, useRemovePushDevice, useSendTestPush, useSubscribeThisDevice, useThisDeviceEndpoint } from "../data/push";
import { lastSentText, pushSupport, type PushSupport } from "../model/push-support";
import { testResultText } from "../model/push-result";

// Por que este aparelho não pode receber, no lugar do botão. "ready" não tem texto: mostra o botão.
const SUPPORT_TEXT: Record<Exclude<PushSupport, "ready">, string> = {
  "install-first": "No iPhone, os avisos só chegam com o app instalado: no Safari, toque em Compartilhar › Adicionar à Tela de Início e abra o app por lá.",
  unsupported: "Este navegador não recebe avisos. No Android, abra o app pelo Chrome.",
  blocked: "As notificações deste site estão bloqueadas. No Chrome, toque no cadeado ao lado do endereço › Permissões › Notificações › Permitir, e recarregue.",
};

function failureText(error: unknown): string {
  return error instanceof PushBrowserError ? error.message : errorMessage(error);
}

/** Configurações › Avisos: inscrever este aparelho, mandar um teste e ver quem recebe. */
export function AvisosSection() {
  const config = usePushConfig();
  return (
    <div className="flex flex-col gap-12">
      <div>
        <SectionTitle
          title="Avisos no celular"
          text="Os avisos chegam como notificação, mesmo com o app fechado. Por enquanto só existe o aviso de teste; o resumo das 6h30 e os alertas vêm nas próximas versões."
        />
        {config.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
        {config.error ? <Notice>{errorMessage(config.error)}</Notice> : null}
        {config.data ? <ThisDeviceCard publicKey={config.data.publicKey} devices={config.data.devices} /> : null}
      </div>
      {config.data ? <DeviceList devices={config.data.devices} /> : null}
    </div>
  );
}

function ThisDeviceCard({ publicKey, devices }: { publicKey: string | null; devices: PushDeviceDto[] }) {
  const [support, setSupport] = useState(() => pushSupport(readPushEnvironment()));
  const endpoint = useThisDeviceEndpoint();
  const current = devices.find((device) => device.endpoint === endpoint.data);
  // A permissão pode ter mudado no pedido do navegador: relê para trocar o botão pelo texto certo.
  const refreshSupport = () => setSupport(pushSupport(readPushEnvironment()));

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-app">
        {current ? "Este aparelho recebe avisos." : "Este aparelho ainda não recebe avisos."}
      </p>
      {publicKey === null ? (
        <Notice>O servidor ainda não tem as chaves de aviso (VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY). Depois de configuradas, volte aqui.</Notice>
      ) : (
        <ThisDeviceAction publicKey={publicKey} support={support} current={current} onSettled={refreshSupport} />
      )}
    </Card>
  );
}

function ThisDeviceAction(props: { publicKey: string; support: PushSupport; current: PushDeviceDto | undefined; onSettled: () => void }) {
  const subscribe = useSubscribeThisDevice();
  const remove = useRemovePushDevice();
  const toast = useToast();
  if (props.current) {
    const device = props.current;
    const stop = () => remove.mutate({ id: device.id, isThisDevice: true }, { onSuccess: () => toast({ text: "Este aparelho não recebe mais avisos." }) });
    return (
      <div>
        <Button tone="ghost" onClick={stop} disabled={remove.isPending}>
          Parar neste aparelho
        </Button>
        {remove.error ? <Notice>{failureText(remove.error)}</Notice> : null}
      </div>
    );
  }
  if (props.support !== "ready") return <p className="max-w-2xl text-sm text-muted">{SUPPORT_TEXT[props.support]}</p>;
  const start = () => subscribe.mutate(props.publicKey, { onSuccess: () => toast({ text: "Pronto: este aparelho vai receber avisos." }), onSettled: props.onSettled });
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={start} disabled={subscribe.isPending}>
        {subscribe.isPending ? "Aguardando o navegador…" : "Receber avisos neste aparelho"}
      </Button>
      {subscribe.error ? <Notice>{failureText(subscribe.error)}</Notice> : null}
    </div>
  );
}

function DeviceList({ devices }: { devices: PushDeviceDto[] }) {
  const endpoint = useThisDeviceEndpoint();
  return (
    <div>
      <SectionTitle title="Aparelhos que recebem avisos" text="Cada celular ou computador onde você tocou em Receber avisos." action={<SendTestButton disabled={devices.length === 0} />} />
      {devices.length === 0 ? <p className="text-sm text-muted">Nenhum aparelho ainda.</p> : null}
      {devices.length > 0 ? (
        <Card compact className="divide-y divide-line">
          {devices.map((device) => (
            <DeviceRow key={device.id} device={device} isThisDevice={device.endpoint === endpoint.data} />
          ))}
        </Card>
      ) : null}
    </div>
  );
}

function SendTestButton({ disabled }: { disabled: boolean }) {
  const send = useSendTestPush();
  const toast = useToast();
  const run = () => send.mutate(undefined, { onSuccess: (result) => toast({ text: testResultText(result) }), onError: (error) => toast({ text: errorMessage(error) }) });
  return (
    <Button tone="ghost" onClick={run} disabled={disabled || send.isPending}>
      {send.isPending ? "Enviando…" : "Enviar aviso de teste"}
    </Button>
  );
}

function DeviceRow({ device, isThisDevice }: { device: PushDeviceDto; isThisDevice: boolean }) {
  const remove = useRemovePushDevice();
  const toast = useToast();
  const name = device.label ?? "Aparelho sem nome";
  const run = () => remove.mutate({ id: device.id, isThisDevice }, { onSuccess: () => toast({ text: `${name} saiu da lista de avisos.` }), onError: (error) => toast({ text: failureText(error) }) });
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-app">
          {name}
          {isThisDevice ? <span className="ml-2 rounded-control bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-app">Este aparelho</span> : null}
        </p>
        <p className="text-xs text-muted">{lastSentText(device.lastSentAt)}</p>
      </div>
      <button type="button" onClick={run} disabled={remove.isPending} aria-label={`Tirar ${name} dos avisos`} className="rounded-control p-2 text-muted transition hover:bg-accent-soft hover:text-app disabled:opacity-50">
        <Icon name="trash" />
      </button>
    </div>
  );
}
