import type { MemberDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Card, Notice } from "../../../design/ui/controls";
import { useSetMemberPublicRp } from "../data/rp-public-admin";

/**
 * Na ficha do colaborador: liga ou desliga a pessoa na lista de técnicos do RP da página pública.
 * @example <PublicRpMemberToggle member={member} />
 */
export function PublicRpMemberToggle({ member }: { member: MemberDto }) {
  const toggle = useSetMemberPublicRp();
  return (
    <Card>
      <label className="flex items-start gap-3 text-sm text-app">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={member.publicRp}
          disabled={toggle.isPending}
          onChange={(event) => toggle.mutate({ memberId: member.id, enabled: event.target.checked })}
        />
        <span>
          <span className="block font-semibold">Aparece no RP público</span>
          <span className="block text-muted">
            Fica na lista de técnicos do formulário da página pública de RPs. Desligar não tira o nome dos RPs já gravados.
          </span>
        </span>
      </label>
      {toggle.isError ? <Notice>{errorMessage(toggle.error)}</Notice> : null}
    </Card>
  );
}
