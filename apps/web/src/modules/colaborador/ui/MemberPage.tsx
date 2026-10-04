import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, PageTitle } from "../../../design/ui/controls";
import { useMembers, useTeams } from "../../cadastro/data/cadastro";
import { positionLabel, shiftLabel } from "../../cadastro/model/labels";
import { teamText } from "../../cadastro/model/team";
import { MemberFormModal } from "../../cadastro/ui/MemberFormModal";
import { MatrixPanel } from "../../competencia/ui/MatrixPanel";
import { resolveTab, tabsFor } from "../model/tabs";
import { BehaviorTab } from "./BehaviorTab";
import { ProfileTab } from "./ProfileTab";

export function MemberPage() {
  const { memberId = "", tab } = useParams();
  const members = useMembers();
  const teams = useTeams();
  const [editing, setEditing] = useState(false);
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
          <Button tone="ghost" onClick={() => setEditing(true)}>
            Editar
          </Button>
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
      {current === "competencias" ? <MatrixPanel memberId={member.id} /> : null}
      {editing ? <MemberFormModal member={member} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
