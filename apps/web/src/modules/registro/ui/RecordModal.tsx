import { useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import type { RecordDto, RecordType } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { useDialogFocus } from "../../../design/ui/dialog";
import { Icon, type IconName } from "../../../design/ui/icons";
import { RowMenu } from "../../../design/ui/row-menu";
import { useRecord } from "../data/records";
import { recordShortName, recordTypeIcon } from "../model/record";
import { RecordMain } from "./record-main";
import { RecordRemoveDialog } from "./RecordRemoveDialog";
import { RecordSide } from "./record-side";
import { useRecordModal } from "./record-link";

// Ficha do registro em modal, no desenho da tarefa do Todoist: barra com o tipo, setas e menu; texto à
// esquerda; campos à direita. Abre por cima de Registros e da Entrada (?registro=id no endereço).

function BarButton({ label, icon, disabled, onClick }: { label: string; icon: IconName; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-chip hover:text-app disabled:opacity-30 disabled:hover:bg-transparent">
      <Icon name={icon} className="h-[18px] w-[18px]" />
    </button>
  );
}

function ModalBar({ record, titleId, onRemove }: { record: RecordDto | undefined; titleId: string; onRemove: () => void }) {
  const modal = useRecordModal();
  const before = modal.neighbor(-1);
  const after = modal.neighbor(1);
  return (
    <header className="flex h-12 shrink-0 items-center gap-1 border-b border-line pl-4 pr-2">
      <h2 id={titleId} className="mr-auto inline-flex items-center gap-1.5 text-sm text-app">
        {record ? <Icon name={recordTypeIcon[record.type]} className="h-4 w-4 text-muted" /> : null}
        {record ? recordShortName(record.type) : "Registro"}
      </h2>
      <BarButton label="Registro de cima" icon="up" disabled={!before} onClick={() => before && modal.go(before)} />
      <BarButton label="Registro de baixo" icon="down" disabled={!after} onClick={() => after && modal.go(after)} />
      {record ? <RowMenu label="Mais ações do registro" items={[{ label: "Excluir registro…", danger: true, onSelect: onRemove }]} /> : null}
      <BarButton label="Fechar" icon="close" onClick={modal.close} />
    </header>
  );
}

// Problema de chamado, ocorrência ou RP é espelho: a ficha de verdade é a de origem.
function OtherOrigin({ record }: { record: RecordDto }) {
  return (
    <div className="p-5 text-sm text-app">
      <p className="text-lg font-semibold">{record.body}</p>
      <p className="mt-3 text-muted">Este registro vem de outra ficha e muda por lá.</p>
      <Link to={`/registros/${record.id}`} className="mt-3 inline-flex font-semibold text-accent">
        Abrir a ficha de origem →
      </Link>
    </div>
  );
}

function ModalBody({ record }: { record: RecordDto }) {
  if (record.origin !== "inbox") return <OtherOrigin record={record} />;
  return (
    <div className="grid min-h-0 flex-1 content-start overflow-y-auto md:content-stretch md:grid-cols-[minmax(0,1fr)_17rem] md:overflow-hidden">
      <div className="px-4 py-5 sm:px-6 md:overflow-y-auto">
        <RecordMain key={record.id} record={record} />
      </div>
      <aside className="border-t border-line bg-chip px-4 py-5 md:overflow-y-auto md:border-l md:border-t-0">
        <RecordSide key={record.id} record={record} />
      </aside>
    </div>
  );
}

function ModalState({ children }: { children: ReactNode }) {
  return <p className="p-5 text-sm text-muted">{children}</p>;
}

/**
 * Modal do registro aberto no endereço; fica montado na página da lista.
 * Ex.: `<RecordModalHost />` dentro de Registros e da Entrada.
 */
export function RecordModalHost() {
  const modal = useRecordModal();
  if (!modal.id) return null;
  return <RecordModal id={modal.id} onClose={modal.close} />;
}

function RecordModal({ id, onClose }: { id: string; onClose: () => void }) {
  const record = useRecord(id);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [removing, setRemoving] = useState(false);
  useDialogFocus(true, onClose, panelRef, { focusField: false });

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border-t border-line bg-card shadow-card focus-visible:outline-none sm:h-[min(46rem,calc(100dvh-3rem))] sm:max-w-4xl sm:rounded-xl sm:border"
      >
        <ModalBar record={record.data} titleId={titleId} onRemove={() => setRemoving(true)} />
        {record.data ? <ModalBody record={record.data} /> : null}
        {record.isPending ? <ModalState>Carregando…</ModalState> : null}
        {record.error ? <ModalState>{errorMessage(record.error)}</ModalState> : null}
      </div>
      {removing && record.data ? <RecordRemoveDialog record={record.data} onCancel={() => setRemoving(false)} onDeleted={onClose} /> : null}
    </div>,
    document.body,
  );
}
