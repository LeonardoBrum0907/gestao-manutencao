import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { TransferListDto, TransferSummaryDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, PageTitle } from "../../../design/ui/controls";
import { DataTable } from "../../../design/ui/data-table";
import { Icon } from "../../../design/ui/icons";
import { useTransfers } from "../data/transfers";
import { transferGroup } from "../model/transfer-view";
import { NewTransferModal } from "./NewTransferModal";
import { TRANSFER_COLUMNS, transferStacked } from "./transfer-table";

// O número da cultura numa linha só: quantos técnicos ensinam alguém e quantos repasses pararam.
function CultureLine({ list }: { list: TransferListDto }) {
  const stale = list.transfers.filter((transfer) => transfer.stale).length;
  return (
    <p className="mb-4 text-sm text-muted">
      <span className="font-semibold tabular-nums text-app">
        {list.teaching} de {list.technicians}
      </span>{" "}
      técnicos ensinando alguém
      {stale ? (
        <>
          {" · "}
          <span className="font-semibold tabular-nums text-pill-warn-text">{stale}</span> {stale === 1 ? "parado" : "parados"} há mais de 60 dias
        </>
      ) : null}
    </p>
  );
}

function TransferTable({ rows, label }: { rows: TransferSummaryDto[]; label: string }) {
  const navigate = useNavigate();
  return (
    <DataTable
      label={label}
      rows={rows}
      rowKey={(transfer) => transfer.id}
      columns={TRANSFER_COLUMNS}
      stacked={transferStacked}
      groupBy={transferGroup}
      onOpen={(transfer) => navigate(`/repasses/${transfer.id}`)}
      countLabel={(count) => (count === 1 ? "1 repasse" : `${count} repasses`)}
    />
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Card>
      <p className="text-sm text-muted">Nenhum repasse ainda. Comece escolhendo quem ensina: o sistema sugere quem aprende.</p>
      <Button className="mt-3 gap-2" onClick={onNew}>
        <Icon name="plus" />
        Novo repasse
      </Button>
    </Card>
  );
}

function ClosedSection({ rows }: { rows: TransferSummaryDto[] }) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return (
    <div className="mt-6">
      <button type="button" className="text-sm font-medium text-accent hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Esconder encerrados" : `Ver encerrados (${rows.length})`}
      </button>
      {open ? <div className="mt-3"><TransferTable rows={rows} label="Repasses encerrados" /></div> : null}
    </div>
  );
}

/** Equipe › Repasses: quem ensina quem, quanto já passou e o que parou. ?novo=<id> abre a janela com quem ensina escolhido. */
export function TransfersPage() {
  const list = useTransfers();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const creating = params.has("novo");
  const setCreating = (teacherId: string | null) => setParams(teacherId === null ? {} : { novo: teacherId }, { replace: true });
  const transfers = list.data?.transfers ?? [];
  const active = transfers.filter((transfer) => transfer.status === "active");
  return (
    <div>
      <PageTitle
        eyebrow="Equipe"
        title="Repasses"
        text="Quem ensina quem: cada técnico prepara alguém para fazer o que ele faz."
        action={
          <Button className="gap-2" onClick={() => setCreating("")}>
            <Icon name="plus" />
            Novo repasse
          </Button>
        }
      />
      {list.isError ? <Notice>{errorMessage(list.error)}</Notice> : null}
      {list.isPending ? <p className="text-sm text-muted">Carregando repasses…</p> : null}
      {list.data ? <CultureLine list={list.data} /> : null}
      {list.data && active.length ? <TransferTable rows={active} label="Repasses em andamento" /> : null}
      {list.data && !active.length ? <EmptyState onNew={() => setCreating("")} /> : null}
      <ClosedSection rows={transfers.filter((transfer) => transfer.status === "closed")} />
      {creating ? (
        <NewTransferModal teacherId={params.get("novo") ?? ""} onClose={() => setCreating(null)} onCreated={(id) => navigate(`/repasses/${id}`)} />
      ) : null}
    </div>
  );
}
