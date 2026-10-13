import { Link } from "react-router-dom";
import type { MemberDto, TransferSummaryDto } from "@manutencao/shared";
import { Card } from "../../../design/ui/controls";
import { useTransfers } from "../data/transfers";
import { shortName } from "../model/transfer-view";

function percentText(transfer: TransferSummaryDto): string {
  return transfer.progress.percent === null ? "" : ` · ${transfer.progress.percent}%`;
}

function TransferLine({ verb, name, transfer }: { verb: string; name: string; transfer: TransferSummaryDto }) {
  return (
    <li className="text-sm">
      <Link to={`/repasses/${transfer.id}`} className="text-app hover:text-accent">
        {verb} <span className="font-medium">{shortName(name)}</span>
        <span className="text-muted">{percentText(transfer)}</span>
      </Link>
    </li>
  );
}

/** Bloco "Repasse" no Perfil do técnico: com quem aprende e quem ensina agora. */
export function MemberTransferCard({ member }: { member: MemberDto }) {
  const list = useTransfers();
  const active = (list.data?.transfers ?? []).filter((transfer) => transfer.status === "active");
  const learning = active.filter((transfer) => transfer.learner.id === member.id);
  const teaching = active.filter((transfer) => transfer.teacher.id === member.id);
  if (!list.data) return null;
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">Repasse</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {learning.map((transfer) => (
          <TransferLine key={transfer.id} verb="Aprende com" name={transfer.teacher.name} transfer={transfer} />
        ))}
        {teaching.map((transfer) => (
          <TransferLine key={transfer.id} verb="Ensina" name={transfer.learner.name} transfer={transfer} />
        ))}
      </ul>
      {teaching.length === 0 ? (
        <p className={`${learning.length ? "mt-2" : ""} text-sm text-muted`}>
          Ainda não ensina ninguém.{" "}
          <Link to={`/repasses?novo=${member.id}`} className="font-medium text-accent hover:underline">
            Novo repasse
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
