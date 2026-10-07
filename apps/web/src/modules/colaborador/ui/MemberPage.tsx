import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, PageTitle } from "../../../design/ui/controls";
import { useMembers, useTeams } from "../../cadastro/data/cadastro";
import { positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamText } from "../../cadastro/model/team";
import { MemberPanel } from "../../cadastro/ui/MemberPanel";
import { MatrixPanel } from "../../competencia/ui/MatrixPanel";
import { resolveTab, tabsFor } from "../model/tabs";
import { BehaviorTab } from "./BehaviorTab";
import { PdiTab } from "./PdiTab";
import { PerformanceTab } from "./PerformanceTab";
import { ReportOptionsModal } from "./ReportOptionsModal";
import { ProfileTab } from "./ProfileTab";

export function MemberPage() {
  const { memberId = "", tab } = useParams();
  const navigate = useNavigate();
  const members = useMembers();
  const teams = useTeams();
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const member = members.data?.find((item) => item.id === memberId);

  const back = (
    <Link to="/cadastro/colaboradores" className="mb-3 inline-block text-sm font-medium text-accent hover:underline">
      ← Colaboradores
    </Link>
  );

  if (members.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (!member) {
    return (
      <div>
        {back}
        <Card>Colaborador não encontrado.</Card>
      </div>
    );
  }

  const allTeams = teams.data ?? [];
  const current = resolveTab(tab, member.position);
  const subtitle = [positionLabel(member.position), member.roleName, member.gradeName, shiftLabel(member.shift), teamText(member, allTeams)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      {back}
      <PageTitle
        eyebrow="Colaborador"
        title={member.name}
        text={subtitle}
        action={
          <div className="flex gap-2">
            <Button tone="ghost" onClick={() => setReporting(true)}>
              Relatório PDF
            </Button>
            <Button tone="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
          </div>
        }
      />
      <nav aria-label="Abas da ficha" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabsFor(member.position).map((item) => (
          <Link
            key={item.key}
            to={`/cadastro/colaboradores/${member.id}/${item.key}`}
            aria-current={current === item.key ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              current === item.key ? "border-accent text-app" : "border-transparent text-muted hover:text-app"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {current === "perfil" ? <ProfileTab member={member} members={members.data ?? []} teams={allTeams} /> : null}
      {current === "comportamento" ? <BehaviorTab member={member} /> : null}
      {current === "desempenho" ? <PerformanceTab member={member} /> : null}
      {current === "matriz" ? <MatrixPanel memberId={member.id} /> : null}
      {current === "pdi" ? <PdiTab member={member} /> : null}
      {reporting ? (
        <ReportOptionsModal memberId={member.id} isTechnician={member.position === "technician"} onClose={() => setReporting(false)} />
      ) : null}
      {editing ? <MemberPanel member={member} showProfileLink={false} onClose={() => setEditing(false)} onDeleted={() => navigate("/cadastro/colaboradores")} /> : null}
    </div>
  );
}
