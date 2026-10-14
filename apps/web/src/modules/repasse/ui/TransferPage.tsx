import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TransferDetailDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Modal, Notice, PageTitle } from "../../../design/ui/controls";
import { RowMenu } from "../../../design/ui/row-menu";
import { useCloseTransfer, useRemoveTransfer, useTransfer } from "../data/transfers";
import { daysAgoLabel, progressLabel, shortDate, shortName } from "../model/transfer-view";
import { EvolutionChart } from "./EvolutionChart";
import { GapList } from "./GapList";
import { TransferBar } from "./TransferBar";

function subtitle(transfer: TransferDetailDto): string {
  const team = transfer.learner.teamName ? `${transfer.learner.teamName} · ` : "";
  if (transfer.closedAt) return `${team}de ${shortDate(transfer.startedAt)} a ${shortDate(transfer.closedAt)} · encerrado`;
  return `${team}desde ${shortDate(transfer.startedAt)}`;
}

function Overview({ transfer }: { transfer: TransferDetailDto }) {
  return (
    <Card>
      <p className="text-4xl font-semibold tabular-nums text-app">
        {transfer.progress.percent ?? 0}% <span className="text-base font-medium text-muted">repassado</span>
      </p>
      <p className="mt-1 text-sm text-muted">
        {shortName(transfer.learner.name)} já faz {progressLabel(transfer.progress)} habilidades que {shortName(transfer.teacher.name)} domina.
      </p>
      {transfer.stale ? <p className="mt-2 text-sm font-medium text-pill-warn-text">Sem nota nova {daysAgoLabel(transfer.lastProgressAt)}.</p> : null}
      <ul className="mt-4 flex flex-col gap-2.5">
        {transfer.byEquipment.map((row) => (
          <li key={row.equipmentId} className="grid grid-cols-[minmax(0,1fr)_6rem_3.5rem] items-center gap-3 text-sm">
            <span className="truncate text-app">{row.name}</span>
            <TransferBar percent={(row.done * 100) / row.mastered} className="w-full" />
            <span className="text-right text-xs tabular-nums text-muted">
              {row.done} de {row.mastered}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Evolution({ transfer }: { transfer: TransferDetailDto }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">Evolução</h2>
      {transfer.evolution.length >= 2 ? (
        <div className="mt-3">
          <EvolutionChart points={transfer.evolution} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">A curva aparece conforme entram notas novas na matriz de {shortName(transfer.learner.name)}.</p>
      )}
    </Card>
  );
}

type Ask = "close" | "remove" | null;

function AskDialog({ ask, transfer, onDone, onCancel }: { ask: Ask; transfer: TransferDetailDto; onDone: () => void; onCancel: () => void }) {
  const close = useCloseTransfer();
  const remove = useRemoveTransfer();
  if (!ask) return null;
  const action = ask === "close" ? close : remove;
  const text =
    ask === "close"
      ? "O repasse sai da lista em andamento e fica nos encerrados, com o que já foi repassado."
      : "Apaga o repasse de vez. Os itens de PDI e as notas da matriz continuam.";
  return (
    <Modal open title={ask === "close" ? "Encerrar repasse" : "Excluir repasse"} onClose={onCancel}>
      <p className="text-sm text-app">{text}</p>
      {action.isError ? <Notice>{errorMessage(action.error)}</Notice> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button tone="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button tone={ask === "close" ? "primary" : "danger"} disabled={action.isPending} onClick={() => action.mutate(transfer.id, { onSuccess: onDone })}>
          {ask === "close" ? "Encerrar" : "Excluir"}
        </Button>
      </div>
    </Modal>
  );
}

function menuItems(transfer: TransferDetailDto, setAsk: (ask: Ask) => void) {
  const close = transfer.status === "active" ? [{ label: "Encerrar repasse", onSelect: () => setAsk("close") }] : [];
  return [...close, { label: "Excluir", danger: true, onSelect: () => setAsk("remove") }];
}

/** Tela do par: quanto já passou, por equipamento, a curva e o que falta repassar. */
export function TransferPage() {
  const { id = "" } = useParams();
  const transfer = useTransfer(id);
  const navigate = useNavigate();
  const [ask, setAsk] = useState<Ask>(null);
  const data = transfer.data;
  const title = data ? `${shortName(data.teacher.name)} → ${shortName(data.learner.name)}` : "Repasse";
  return (
    <div>
      <PageTitle
        eyebrow="Repasse"
        title={title}
        text={data ? subtitle(data) : undefined}
        back={{ to: "/repasses", label: "Repasses" }}
        action={data ? <RowMenu label="Ações do repasse" items={menuItems(data, setAsk)} /> : undefined}
      />
      {transfer.isError ? <Notice>{errorMessage(transfer.error)}</Notice> : null}
      {transfer.isPending ? <p className="text-sm text-muted">Carregando repasse…</p> : null}
      {data ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Overview transfer={data} />
            <Evolution transfer={data} />
          </div>
          <GapList transfer={data} />
          <AskDialog ask={ask} transfer={data} onCancel={() => setAsk(null)} onDone={() => (ask === "remove" ? navigate("/repasses", { replace: true }) : setAsk(null))} />
        </div>
      ) : null}
    </div>
  );
}
