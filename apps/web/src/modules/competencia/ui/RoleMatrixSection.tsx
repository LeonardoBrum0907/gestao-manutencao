import { MATRIX_CATEGORIES, MATRIX_CATEGORY_LABELS, isMatrixCategory, type MemberRoleDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { useRoles, useSetRoleMatrixCategory } from "../../cadastro/data/cadastro";

const BOTH = "";

function RoleRow({ role, disabled, onPick }: { role: MemberRoleDto; disabled: boolean; onPick: (role: MemberRoleDto, value: string) => void }) {
  return (
    <li className="grid gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(8rem,1fr)_minmax(0,16rem)] sm:items-center sm:px-5">
      <p className="text-sm font-semibold text-app first-letter:uppercase">{role.name}</p>
      <SelectInput
        aria-label={`Habilidades da matriz para ${role.name}`}
        className="!w-full"
        disabled={disabled}
        value={role.matrixCategory ?? BOTH}
        onChange={(event) => onPick(role, event.target.value)}
      >
        <option value={BOTH}>As duas</option>
        {MATRIX_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            Só de {MATRIX_CATEGORY_LABELS[category]}
          </option>
        ))}
      </SelectInput>
    </li>
  );
}

/** Configurações › Avaliação: que habilidades da matriz (de mecânico, de eletricista ou as duas) cada função vê. */
export function RoleMatrixSection() {
  const roles = useRoles();
  const save = useSetRoleMatrixCategory();
  const pick = (role: MemberRoleDto, value: string) => save.mutate({ id: role.id, matrixCategory: isMatrixCategory(value) ? value : null });
  return (
    <div>
      <SectionTitle
        title="Matriz por função"
        text="Que habilidades da matriz cada função vê e conta na aderência. As notas de outra categoria ficam guardadas e voltam se você mudar de ideia."
      />
      {save.error ? <Notice>{errorMessage(save.error)}</Notice> : null}
      {roles.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {roles.data?.length ? (
        <ul className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          {roles.data.map((role) => (
            <RoleRow key={role.id} role={role} disabled={save.isPending} onPick={pick} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
