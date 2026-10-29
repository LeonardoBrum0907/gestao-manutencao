import type { RecordLink } from "./record-link";
import type { RepeatGhost } from "../model/task-repeat";
import { CheckRow } from "./checklist";
import { RepeatMark } from "./task-parts";

/**
 * As próximas vezes das tarefas que se repetem num dia da Agenda: apagadas, sem concluir nem arrastar (ainda
 * não existem; nascem quando a de antes é concluída). O clique abre a tarefa de agora da série.
 * Ex.: `<RepeatGhostList ghosts={ghosts[day]} linkOf={linkOf} />`
 */
export function RepeatGhostList({ ghosts = [], linkOf }: { ghosts?: RepeatGhost[]; linkOf: (ghost: RepeatGhost) => RecordLink }) {
  if (ghosts.length === 0) return null;
  return (
    <ul aria-label="Próximas vezes das tarefas que se repetem" className="opacity-60">
      {ghosts.map((ghost) => (
        <li key={`${ghost.item.id}-${ghost.day}`} className="border-b border-dashed border-line md:mb-2 md:rounded-control md:border">
          <CheckRow checked={false} label={`Próxima vez: ${ghost.item.body}`} link={linkOf(ghost)} title={ghost.item.body} info={<RepeatMark repeat={ghost.item.repeat} />} />
        </li>
      ))}
    </ul>
  );
}
