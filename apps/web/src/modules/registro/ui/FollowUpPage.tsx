import { useSearchParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { FeedbackBoard } from "./FeedbackBoard";
import { ProblemBoard } from "./ProblemBoard";
import { RecordModalHost } from "./RecordModal";
import { TaskBoard } from "./TaskBoard";

type Tab = "tarefas" | "problemas" | "feedbacks";

const tabs: { tab: Tab; label: string }[] = [
  { tab: "tarefas", label: "Tarefas" },
  { tab: "problemas", label: "Problemas" },
  { tab: "feedbacks", label: "Feedbacks" },
];

function tabOf(params: URLSearchParams): Tab {
  const tab = params.get("tab");
  if (tab === "problemas" || tab === "feedbacks") return tab;
  return "tarefas";
}

export function FollowUpPage() {
  const [params, setParams] = useSearchParams();
  const tab = tabOf(params);
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Registros" />
      <div role="tablist" aria-label="Tipo de pendência" className="-mt-2 mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.tab}
            type="button"
            role="tab"
            aria-selected={tab === item.tab}
            onClick={() => setParams(item.tab === "tarefas" ? {} : { tab: item.tab }, { replace: true })}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] transition ${
              tab === item.tab ? "border-accent font-semibold text-app" : "border-transparent text-muted hover:text-app"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "tarefas" ? <TaskBoard /> : tab === "problemas" ? <ProblemBoard /> : <FeedbackBoard />}
      <RecordModalHost />
    </div>
  );
}
