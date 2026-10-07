import type { MemberGradeDto } from "@manutencao/shared";
import { SectionTitle } from "../../../design/ui/controls";
import { InlineNameList } from "../../../design/ui/inline-list";
import { useToast } from "../../../design/ui/toast";
import { useDeleteGrade, useGrades, useMembers, useSaveGrade } from "../data/cadastro";
import { usageText } from "../model/usage";

export function GradesSection() {
  const grades = useGrades();
  const members = useMembers();
  const save = useSaveGrade();
  const remove = useDeleteGrade();
  const toast = useToast();

  return (
    <div>
      <SectionTitle title="Graus" text="A senioridade do colaborador. Grau em uso não sai da lista." />
      {grades.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {grades.data ? (
        <InlineNameList<MemberGradeDto & { meta: string }>
          items={grades.data.map((grade) => ({ ...grade, meta: usageText(members.data?.filter((member) => member.gradeId === grade.id).length) }))}
          emptyText="Nenhum grau ainda."
          addLabel="Adicionar grau"
          placeholder="Ex.: Grau IV"
          onAdd={(name) => save.mutateAsync({ name })}
          onRename={(grade, name) => save.mutateAsync({ id: grade.id, name })}
          removalPath={(grade) => `/api/member-grades/${grade.id}`}
          onRemove={async (grade) => {
            await remove.mutateAsync(grade.id);
            toast({ text: `Grau ${grade.name} excluído.` });
          }}
        />
      ) : null}
    </div>
  );
}
