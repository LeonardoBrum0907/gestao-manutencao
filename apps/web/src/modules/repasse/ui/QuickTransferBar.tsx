import { useNavigate } from "react-router-dom";
import { Button } from "../../../design/ui/controls";
import { Icon } from "../../../design/ui/icons";
import { useToast } from "../../../design/ui/toast";
import { shortName } from "../model/transfer-view";
import { NewTransferModal } from "./NewTransferModal";
import type { QuickTransfer } from "./use-quick-transfer";

/** Botão da barra da Matriz da equipe que liga e desliga o repasse rápido. */
export function QuickTransferButton({ quick }: { quick: QuickTransfer }) {
  const on = quick.picker !== null;
  return (
    <Button tone="ghost" className="gap-2" aria-pressed={on} onClick={on ? quick.stop : quick.start}>
      <Icon name="handoff" />
      {on ? "Cancelar repasse" : "Novo repasse"}
    </Button>
  );
}

function stepText(teacherName: string | null) {
  if (!teacherName) return <>Clique em quem ensina: no nome, ou na célula do equipamento em foco.</>;
  return (
    <>
      <span className="font-semibold">{shortName(teacherName)}</span> ensina. Agora clique em quem aprende (clicar de novo em {shortName(teacherName)} desfaz).
    </>
  );
}

/** Faixa acima da grade com o passo do repasse rápido e, depois do segundo clique, a janela já preenchida. */
export function QuickTransferBar({ quick }: { quick: QuickTransfer }) {
  const navigate = useNavigate();
  const toast = useToast();
  if (!quick.picker) return null;

  function created(id: string) {
    quick.stop();
    toast({ text: "Repasse criado.", action: { label: "Abrir", run: () => navigate(`/repasses/${id}`) } });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-line bg-accent-soft px-4 py-2.5 text-sm text-accent-ink sm:px-5">
      <Icon name="handoff" />
      <p className="min-w-0 flex-1">{stepText(quick.teacherName)}</p>
      {quick.draft ? (
        <NewTransferModal {...quick.draft} onClose={quick.backToPicking} onCreated={created} />
      ) : null}
    </div>
  );
}
