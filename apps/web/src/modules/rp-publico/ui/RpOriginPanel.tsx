import { useState } from "react";
import { RP_REVISION_LABELS, type RpDto, type RpRevisionDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice } from "../../../design/ui/controls";
import { useRestoreRpRevision, useRpRevisions, useSetRpChecked } from "../data/rp-public-admin";
import { ReviewRequestNotice } from "./public-rp-parts";

const when = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function CheckRow({ rp }: { rp: RpDto }) {
  const check = useSetRpChecked(rp.id);
  const checked = rp.checkedAt !== null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-app">
        <span className="font-semibold">Enviado pela página pública.</span>{" "}
        {checked ? `Conferido em ${when.format(new Date(rp.checkedAt!))}.` : "Ainda não conferido: fica fora do Pareto do Dashboard até você conferir."}
      </p>
      <Button tone={checked ? "ghost" : "primary"} disabled={check.isPending} onClick={() => check.mutate(!checked)}>
        {checked ? "Desmarcar conferido" : "Marcar conferido"}
      </Button>
      {check.isError ? <Notice>{errorMessage(check.error)}</Notice> : null}
    </div>
  );
}

function RevisionItem({ revision, onUndo, busy }: { revision: RpRevisionDto; onUndo: () => void; busy: boolean }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-t border-t-line py-3 text-sm first:border-t-0">
      <span>
        <span className="font-medium text-app">{RP_REVISION_LABELS[revision.kind]}</span>{" "}
        <span className="text-muted">· {when.format(new Date(revision.createdAt))}</span>
        {revision.note ? <span className="mt-1 block whitespace-pre-line text-muted">{revision.note}</span> : null}
      </span>
      {revision.kind === "review_request" ? null : (
        <Button tone="ghost" disabled={busy} onClick={onUndo}>
          Desfazer
        </Button>
      )}
    </li>
  );
}

function History({ rpId, onRestored }: { rpId: string; onRestored: () => void }) {
  const [open, setOpen] = useState(false);
  const revisions = useRpRevisions(rpId, open);
  const restore = useRestoreRpRevision(rpId);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-semibold text-app">Histórico de alterações</summary>
      <p className="mt-2 text-xs text-muted">Desfazer volta os campos para como estavam antes daquela alteração. O estado de agora fica guardado aqui.</p>
      {revisions.isPending && open ? <p className="mt-2 text-sm text-muted">Carregando…</p> : null}
      {revisions.data && !revisions.data.length ? <p className="mt-2 text-sm text-muted">Nenhuma alteração pela página pública.</p> : null}
      <ul className="mt-2">
        {revisions.data?.map((revision) => (
          <RevisionItem key={revision.id} revision={revision} busy={restore.isPending} onUndo={() => restore.mutate(revision.id, { onSuccess: onRestored })} />
        ))}
      </ul>
      {restore.isError ? <Notice>{errorMessage(restore.error)}</Notice> : null}
    </details>
  );
}

/**
 * Na ficha do RP no app: conferido, pedido de revisão e histórico, só para RP da página pública.
 * `onRestored` avisa a ficha para recarregar o formulário com os campos desfeitos.
 * @example {rp.source === "public" ? <RpOriginPanel rp={rp} onRestored={recarregar} /> : null}
 */
export function RpOriginPanel({ rp, onRestored }: { rp: RpDto; onRestored: () => void }) {
  return (
    <Card className="mb-6">
      <div className="flex flex-col gap-4">
        <CheckRow rp={rp} />
        {rp.reviewRequest ? <ReviewRequestNotice text={rp.reviewRequest} at={rp.reviewRequestedAt} /> : null}
        <History rpId={rp.id} onRestored={onRestored} />
      </div>
    </Card>
  );
}
