import type { RecordDto, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { useToast } from "../../../design/ui/toast";
import { useUpdateRecord } from "../data/records";
import { sheetBody, type SheetPatch } from "../model/record-sheet";

/**
 * Grava um campo do modal assim que ele muda (sem botão Gravar); erro vira aviso no rodapé da tela.
 * Ex.: `const save = useRecordSave(record); save({ priority: "high" }); save({}, "problem")`
 */
export function useRecordSave(record: RecordDto): (patch: SheetPatch, type?: RecordType) => void {
  const update = useUpdateRecord(record.id);
  const toast = useToast();
  return (patch, type) => update.mutate(sheetBody(record, patch, type), { onError: (error) => toast({ text: errorMessage(error) }) });
}
