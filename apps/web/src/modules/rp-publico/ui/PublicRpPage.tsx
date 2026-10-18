import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { RP_FOUR_M, RP_FOUR_M_LABELS, type PublicRpDirectoryDto, type PublicRpDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, TextArea } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { formatRpDay } from "../../rp/model/rp";
import { useBulkReview, usePublicAccess, usePublicDirectory, usePublicRp, useRequestReview } from "../data/public-rp";
import { publicRpPath, publicRpUrl } from "../model/public-rp";
import { publicRpWhatsappText } from "../model/public-rp-whatsapp";
import { bulkDoneText, NOTE_PROMPTS } from "../model/public-rp-review";
import { RpBadges } from "./PublicRpSelection";
import { copyText, NoteDialog, ReviewRequestNotice } from "./public-rp-parts";

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm text-app">{children || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

function placeItems(rp: PublicRpDto, directory: PublicRpDirectoryDto | undefined) {
  const factory = directory?.factories.find((item) => item.id === rp.factoryId)?.name;
  const line = (rp.lineId && directory?.lines.find((item) => item.id === rp.lineId)?.name) || rp.line;
  const machine = directory?.machines.find((item) => item.id === rp.machineId)?.name;
  return { factory, line, machine };
}

function RpDetails({ rp, directory }: { rp: PublicRpDto; directory: PublicRpDirectoryDto | undefined }) {
  const place = placeItems(rp, directory);
  const causes = RP_FOUR_M.filter((key) => rp.causes[key].marked || rp.causes[key].text);
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Item label="Data">{formatRpDay(rp.occurredAt)}</Item>
      <Item label="Ordem">{rp.orderNumber}</Item>
      <Item label="Fábrica">{place.factory}</Item>
      <Item label="Linha">{place.line}</Item>
      <Item label="Máquina">{place.machine}</Item>
      <Item label="TAG">{rp.tag}</Item>
      <div className="sm:col-span-2"><Item label="Problema (o que ocorreu?)">{rp.problem}</Item></div>
      <div className="sm:col-span-2"><Item label="Descrição (o que foi observado?)">{rp.description}</Item></div>
      <Item label="Falha repetida?">{rp.repeatedFailure ? ["Sim", rp.repeatedTimes && `${rp.repeatedTimes} vezes`, rp.repeatedPeriod].filter(Boolean).join(" · ") : "Não"}</Item>
      <Item label="4M: possíveis causas">{causes.map((key) => `${RP_FOUR_M_LABELS[key]}${rp.causes[key].text ? `: ${rp.causes[key].text}` : ""}`).join("\n")}</Item>
      <div className="sm:col-span-2"><Item label="Causa raiz (por que aconteceu?)">{rp.rootCause}</Item></div>
      <div className="sm:col-span-2"><Item label="Contramedida corretiva (o que foi feito agora?)">{rp.corrective}</Item></div>
      <div className="sm:col-span-2"><Item label="Contramedida preventiva (como evitar repetir?)">{rp.preventive}</Item></div>
      <Item label="Técnico">{rp.memberNames.join(", ")}</Item>
      <Item label="Impacto em condição básica?">{rp.basicConditionImpact}</Item>
    </dl>
  );
}

function AskReview({ code, id, onDone }: { code: string; id: string; onDone: () => void }) {
  const request = useRequestReview(code, id);
  const [text, setText] = useState("");
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <Field label="O que precisa revisar?">
          <TextArea value={text} placeholder="Ex.: faltou a causa raiz; confirme a TAG" onChange={(event) => setText(event.target.value)} />
        </Field>
        {request.isError ? <Notice>{errorMessage(request.error)}</Notice> : null}
        <div className="flex flex-wrap gap-3">
          <Button disabled={request.isPending} onClick={() => request.mutate(text, { onSuccess: onDone })}>
            {request.isPending ? "Enviando…" : "Pedir revisão"}
          </Button>
          <Button tone="ghost" onClick={onDone}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Aprovar e Recusar do supervisor, pela mesma rota do lote (um RP só).
function DecisionButtons({ code, rp }: { code: string; rp: PublicRpDto }) {
  const review = useBulkReview(code);
  const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  function decide(action: "approve" | "reject", note?: string) {
    review.mutate(
      { ids: [rp.id], action, note },
      {
        onSuccess: (result) => {
          toast({ text: bulkDoneText(action, result.updated) });
          setRejecting(false);
        },
        onError: (error) => toast({ text: `Não deu para gravar: ${errorMessage(error)}` }),
      },
    );
  }
  return (
    <>
      {rp.decision === "approved" ? null : (
        <Button tone="ghost" disabled={review.isPending} onClick={() => decide("approve")}>
          Aprovar
        </Button>
      )}
      {rp.decision === "rejected" ? null : (
        <Button tone="ghost" disabled={review.isPending} onClick={() => setRejecting(true)}>
          Recusar
        </Button>
      )}
      {rejecting ? (
        <NoteDialog prompt={NOTE_PROMPTS.reject} pending={review.isPending} onClose={() => setRejecting(false)} onConfirm={(note) => decide("reject", note)} />
      ) : null}
    </>
  );
}

function RejectionNotice({ note }: { note: string | null }) {
  return (
    <div role="status" className="flex flex-col gap-1 rounded-control border border-danger bg-danger-soft p-4 text-sm text-app">
      <p className="font-semibold text-danger">RP recusado</p>
      {note ? <p className="whitespace-pre-line">{note}</p> : null}
    </div>
  );
}

// supervisor: só o link de um supervisor avalia o RP (a API também recusa no link da equipe).
type ActionsProps = { code: string; rp: PublicRpDto; lines: PublicRpDirectoryDto["lines"]; supervisor: boolean; onAskReview: () => void };

function Actions({ code, rp, lines, supervisor, onAskReview }: ActionsProps) {
  const toast = useToast();
  async function copyLink() {
    const url = publicRpUrl(window.location.origin, code, rp.id);
    toast({ text: (await copyText(url)) ? "Link do RP copiado. Cole no WhatsApp, Teams ou onde quiser." : `Copie o endereço: ${url}` });
  }
  async function copyReport() {
    const copied = await copyText(publicRpWhatsappText(rp, lines));
    toast({ text: copied ? "Texto do RP copiado. Cole no WhatsApp, Teams ou onde quiser." : "Não deu para copiar: o navegador bloqueou a área de transferência." });
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        to={publicRpPath(code, rp.id, "editar")}
        className="inline-flex items-center justify-center rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition hover:brightness-90"
      >
        Editar
      </Link>
      <Button tone="ghost" onClick={() => void copyReport()}>
        Copiar como texto
      </Button>
      <Button tone="ghost" onClick={() => void copyLink()}>
        Copiar link
      </Button>
      {supervisor ? (
        <>
          <Button tone="ghost" onClick={onAskReview}>
            Pedir revisão
          </Button>
          <DecisionButtons code={code} rp={rp} />
        </>
      ) : null}
    </div>
  );
}

/**
 * Leitura de um RP da página pública, com Editar, Copiar como texto (modelo do WhatsApp) e Copiar link. No link de um
 * supervisor também Pedir revisão, Aprovar e Recusar.
 * @example <Route path=":id" element={<PublicRpPage />} />
 */
export function PublicRpPage() {
  const { code = "", id = "" } = useParams();
  const rp = usePublicRp(code, id);
  const directory = usePublicDirectory(code);
  const access = usePublicAccess(code);
  const [asking, setAsking] = useState(false);

  if (rp.isPending) return <p className="text-sm text-muted">Carregando RP…</p>;
  if (rp.isError) return <Notice>{errorMessage(rp.error)}</Notice>;
  const data = rp.data;

  return (
    <div className="flex flex-col gap-4">
      <Link to={publicRpPath(code)} className="text-sm font-semibold text-accent hover:underline">
        ← Todos os RPs
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold text-app">Relatório padrão</h1>
        <RpBadges decision={data.decision} status={data.status} />
      </div>
      {data.decision === "rejected" ? <RejectionNotice note={data.rejectionNote} /> : null}
      {data.reviewRequest ? <ReviewRequestNotice text={data.reviewRequest} at={data.reviewRequestedAt} /> : null}
      <Actions code={code} rp={data} lines={directory.data?.lines ?? []} supervisor={access.data?.role === "supervisor"} onAskReview={() => setAsking(true)} />
      {asking ? <AskReview code={code} id={data.id} onDone={() => setAsking(false)} /> : null}
      <Card>
        <RpDetails rp={data} directory={directory.data} />
      </Card>
    </div>
  );
}
