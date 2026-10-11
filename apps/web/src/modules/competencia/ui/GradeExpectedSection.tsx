import {
  COMPETENCY_LEVEL_EXPECTED,
  COMPETENCY_LEVELS,
  COMPETENCY_SCORE_LABELS,
  type CompetencyLevel,
  type CompetencyScore,
  type MemberGradeDto,
} from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Notice, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { useGrades, useSetGradeExpected } from "../../cadastro/data/cadastro";

const SCORES: CompetencyScore[] = [1, 2, 3, 4];

// "Habilidade básica", não "Habilidade básico": o rótulo da dificuldade é masculino em COMPETENCY_LEVEL_LABELS.
const SKILL_OF_LEVEL: Record<CompetencyLevel, string> = {
  basic: "Habilidade básica",
  intermediate: "Habilidade intermediária",
  advanced: "Habilidade avançada",
};

function ExpectedSelect({
  grade,
  level,
  disabled,
  onPick,
}: {
  grade: MemberGradeDto;
  level: CompetencyLevel;
  disabled: boolean;
  onPick: (level: CompetencyLevel, value: number | null) => void;
}) {
  return (
    <SelectInput
      aria-label={`Esperado de ${grade.name}: ${SKILL_OF_LEVEL[level].toLowerCase()}`}
      className="!w-full"
      disabled={disabled}
      value={grade.expected[level] ?? ""}
      onChange={(event) => onPick(level, event.target.value ? Number(event.target.value) : null)}
    >
      <option value="">Padrão ({COMPETENCY_LEVEL_EXPECTED[level]})</option>
      {SCORES.map((score) => (
        <option key={score} value={score}>
          {score} · {COMPETENCY_SCORE_LABELS[score].label}
        </option>
      ))}
    </SelectInput>
  );
}

// Uma linha por grau; no celular as três dificuldades empilham embaixo do nome.
function GradeRow({ grade, disabled, onSave }: { grade: MemberGradeDto; disabled: boolean; onSave: (grade: MemberGradeDto) => void }) {
  const pick = (level: CompetencyLevel, value: number | null) => onSave({ ...grade, expected: { ...grade.expected, [level]: value } });
  return (
    <li className="grid gap-2 border-t border-line px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(8rem,1fr)_repeat(3,minmax(0,1fr))] sm:items-center sm:px-5">
      <p className="text-sm font-semibold text-app">{grade.name}</p>
      {COMPETENCY_LEVELS.map((level) => (
        <label key={level} className="flex items-center gap-2 sm:block">
          <span className="w-28 shrink-0 text-xs text-muted sm:hidden">{SKILL_OF_LEVEL[level]}</span>
          <ExpectedSelect grade={grade} level={level} disabled={disabled} onPick={pick} />
        </label>
      ))}
    </li>
  );
}

/** Configurações › Avaliação: esperado da matriz por grau do colaborador e dificuldade da habilidade. */
export function GradeExpectedSection() {
  const grades = useGrades();
  const save = useSetGradeExpected();
  return (
    <div>
      <SectionTitle
        title="Esperado da matriz por grau"
        text="Quanto você espera de cada grau em cada dificuldade de habilidade. Vazio usa o padrão da dificuldade. O esp. marcado na linha da habilidade do colaborador continua valendo acima disto."
      />
      {save.error ? <Notice>{errorMessage(save.error)}</Notice> : null}
      {grades.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {grades.data?.length === 0 ? <p className="text-sm text-muted">Cadastre os graus em Funções e graus primeiro.</p> : null}
      {grades.data?.length ? (
        <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
          <div className="hidden grid-cols-[minmax(8rem,1fr)_repeat(3,minmax(0,1fr))] gap-2 border-b border-line bg-chip px-5 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:grid">
            <span>Grau</span>
            {COMPETENCY_LEVELS.map((level) => (
              <span key={level}>{SKILL_OF_LEVEL[level]}</span>
            ))}
          </div>
          <ul>
            {grades.data.map((grade) => (
              <GradeRow
                key={grade.id}
                grade={grade}
                disabled={save.isPending}
                onSave={(next) => save.mutate({ id: next.id, expected: next.expected })}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
