import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, PageTitle } from "../../../design/ui/controls";
import { TabBar } from "../../../design/ui/tab-bar";
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
      <PageTitle
        eyebrow="Colaborador"
        title={member.name}
        back={{ to: "/cadastro/colaboradores", label: "Colaboradores" }}
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
      <TabBar
        label="Abas da ficha"
        tabs={tabsFor(member.position).map((item) => ({ key: item.key, label: item.label, to: `/cadastro/colaboradores/${member.id}/${item.key}` }))}
        current={current}
      />
      {current === "perfil" ? <ProfileTab member={member} members={members.data ?? []} teams={allTeams} /> : null}
      {current === "comportamento" ? <BehaviorTab member={member} /> : null}
      {current === "desempenho" ? <PerformanceTab member={member} /> : null}
      {current === "matriz" ? <MatrixPanel memberId={member.id} /> : null}
      {current === "pdi" ? <PdiTab member={member} /> : null}
      {reporting ? (
        <ReportOptionsModal memberId={member.id} isTechnician={member.position === "technician"} onClose={() => setReporting(false)} />
      ) : null}
      {editing ? <MemberPanel member={member} showProfileLink={false} onClose={() => setEditing(false)} onDeleted={() => navigate("/cadastro/colaboradores", { replace: true })} /> : null}
    </div>
  );
}
