import { RemoveDialog } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useDeleteRecord } from "../data/records";
import { recordCaption } from "../model/record";

// Excluir um registro, da ficha ou do menu ⋯ das Pendências. Sempre dá para excluir; o que vai
// junto (RP, anexos, histórico dos colaboradores) aparece na pergunta antes de confirmar.
export function RecordRemoveDialog({
  record,
  onCancel,
  onDeleted,
}: {
  record: { id: string; body: string };
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const remove = useDeleteRecord();
  const toast = useToast();
  return (
    <RemoveDialog
      path={`/api/records/${record.id}`}
      name={recordCaption(record.body)}
      removing={remove.isPending}
      error={remove.error}
      onCancel={onCancel}
      onConfirm={() =>
        remove.mutate(record.id, {
          onSuccess: () => {
            toast({ text: "Registro excluído." });
            onDeleted();
          },
        })
      }
    />
  );
}
