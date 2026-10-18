import type { MemberRoleDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteRole, useMembers, useRoles, useSaveRole, useSetRoleLeadsTeams } from "../data/cadastro";
import { roleMetaText } from "../model/member-role";
import { usageText } from "../model/usage";

export function RolesSection() {
  const roles = useRoles();
  const members = useMembers();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const leads = useSetRoleLeadsTeams();
  const toast = useToast();

  async function setLeadsTeams(role: MemberRoleDto, leadsTeams: boolean) {
    try {
      await leads.mutateAsync({ id: role.id, leadsTeams });
    } catch (error) {
      toast({ text: errorMessage(error) });
      return;
    }
    toast({ text: leadsTeams ? `${role.name} agora lidera equipe.` : `${role.name} não lidera mais equipe.` });
  }

  return (
    <div>
      <SectionTitle
        title="Funções"
        text="A função do colaborador. Quem tem uma função que lidera equipe é supervisor: lidera a equipe em vez de entrar nela, e não tem matriz nem desempenho. Marque pelo menu ⋯."
      />
      {roles.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {roles.data ? (
        <InlineNameList<MemberRoleDto & { meta: string }>
          items={roles.data.map((role) => ({
            ...role,
            meta: roleMetaText(role, usageText(members.data?.filter((member) => member.roleId === role.id).length)),
          }))}
          nameHeader="Função"
          emptyText="Nenhuma função ainda."
          addLabel="Adicionar função"
          placeholder="Ex.: Caldeireiro"
          onAdd={(name) => save.mutateAsync({ name })}
          onRename={(role, name) => save.mutateAsync({ id: role.id, name })}
          removalPath={(role) => `/api/member-roles/${role.id}`}
          onRemove={async (role) => {
            await remove.mutateAsync(role.id);
            toast({ text: `Função ${role.name} excluída.` });
          }}
          menuItems={(role) => [
            role.leadsTeams
              ? { label: "Deixar de liderar equipe", disabled: leads.isPending, onSelect: () => void setLeadsTeams(role, false) }
              : { label: "Lidera equipe (supervisor)", disabled: leads.isPending, onSelect: () => void setLeadsTeams(role, true) },
          ]}
        />
      ) : null}
    </div>
  );
}
