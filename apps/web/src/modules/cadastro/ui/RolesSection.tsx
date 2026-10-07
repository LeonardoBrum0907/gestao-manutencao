import type { MemberRoleDto } from "@manutencao/shared";
import { SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteRole, useMembers, useRoles, useSaveRole } from "../data/cadastro";
import { usageText } from "../model/usage";

export function RolesSection() {
  const roles = useRoles();
  const members = useMembers();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const toast = useToast();

  return (
    <div>
      <SectionTitle title="Funções" text="As funções do colaborador. As seis do SIGEM já estão na lista e não saem; dá para renomear." />
      {roles.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {roles.data ? (
        <InlineNameList<MemberRoleDto & { meta: string }>
          items={roles.data.map((role) => ({ ...role, meta: usageText(members.data?.filter((member) => member.roleId === role.id).length) }))}
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
        />
      ) : null}
    </div>
  );
}
