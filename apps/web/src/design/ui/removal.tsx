import { useQuery } from "@tanstack/react-query";
import type { RemovalCheckDto } from "@manutencao/shared";
import { api, errorMessage } from "../../app/http";
import { Button, Modal, Notice } from "./controls";

export type RemovalAlternative = { label: string; onClick: () => void; pending?: boolean };

type PromptProps = {
  // Endereço do item na API, sem o /removal: "/api/lines/123".
  path: string;
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  removing: boolean;
  error?: unknown;
  // Saída que não perde nada (inativar, arquivar), oferecida quando excluir não dá.
  alternative?: RemovalAlternative;
  framed?: boolean;
};

// Pergunta de exclusão que já sabe a resposta: confere na API antes e, se o item está em uso,
// diz o motivo e oferece a saída em vez do botão de excluir.
export function RemovalPrompt({ path, name, onConfirm, onCancel, removing, error, alternative, framed = true }: PromptProps) {
  const check = useQuery({
    queryKey: ["removal", path],
    queryFn: () => api<RemovalCheckDto>(`${path}/removal`),
    staleTime: 0,
    gcTime: 0,
  });
  const box = framed ? "rounded-card bg-danger-soft p-4" : "";

  if (check.isPending) {
    return (
      <div className={box} role="status">
        <p className="text-sm text-app">Conferindo o que está ligado a “{name}”…</p>
      </div>
    );
  }

  if (check.isError) {
    return (
      <div className={`flex flex-col gap-3 ${box}`}>
        <Notice>{errorMessage(check.error)}</Notice>
        <div>
          <Button tone="ghost" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const blocked = !check.data.canRemove;
  return (
    <div className={`flex flex-col gap-3 ${box}`} role="alert">
      <p className="text-sm font-semibold text-app">{blocked ? `Não dá para excluir “${name}”` : `Excluir “${name}”?`}</p>
      {!blocked && check.data.warnings.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-app">
          {check.data.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <p className="text-sm text-app">{blocked ? check.data.reason : "Não dá para desfazer."}</p>
      {error ? <Notice>{errorMessage(error)}</Notice> : null}
      <div className="flex flex-wrap gap-2">
        {blocked && alternative ? (
          <Button disabled={alternative.pending} onClick={alternative.onClick}>
            {alternative.label}
          </Button>
        ) : null}
        {!blocked ? (
          <Button tone="danger" disabled={removing} onClick={onConfirm}>
            {removing ? "Excluindo…" : "Sim, excluir"}
          </Button>
        ) : null}
        <Button tone="ghost" onClick={onCancel}>
          Voltar
        </Button>
      </div>
    </div>
  );
}

// A mesma pergunta numa janela, para quando o Excluir vem do menu ⋯ da linha.
export function RemoveDialog(props: Omit<PromptProps, "framed">) {
  return (
    <Modal open title="Excluir" onClose={props.onCancel}>
      <RemovalPrompt {...props} framed={false} />
    </Modal>
  );
}
