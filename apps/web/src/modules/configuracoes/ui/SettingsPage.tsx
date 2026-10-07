import { Link, useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { CompetenciesSection } from "../../cadastro/ui/CompetenciesSection";
import { EquipmentModelsSection } from "../../cadastro/ui/EquipmentModelsSection";
import { FactoriesSection } from "../../cadastro/ui/FactoriesSection";
import { GradesSection } from "../../cadastro/ui/GradesSection";
import { LinesSection } from "../../cadastro/ui/LinesSection";
import { RolesSection } from "../../cadastro/ui/RolesSection";
import { SubassembliesSection } from "../../cadastro/ui/SubassembliesSection";
import { MatrixCatalogSection } from "../../competencia/ui/MatrixCatalogSection";

// Cadastros que se arrumam uma vez e pouco mudam: ficam fora do menu, numa página com abas (como no SIGEM).
export const SETTINGS_TABS = [
  { key: "fabricas", label: "Fábricas, linhas e máquinas" },
  { key: "funcoes", label: "Funções e graus" },
  { key: "avaliacao", label: "Avaliação" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["key"];

function resolveTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.find((tab) => tab.key === value)?.key ?? "fabricas";
}

export function SettingsPage() {
  const current = resolveTab(useParams().tab);
  return (
    <div>
      <PageTitle title="Configurações" text="Os cadastros de apoio: o que se arruma uma vez e pouco muda." />
      <nav aria-label="Abas de configurações" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {SETTINGS_TABS.map((tab) => (
          <Link
            key={tab.key}
            to={`/configuracoes/${tab.key}`}
            aria-current={current === tab.key ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              current === tab.key ? "border-accent text-app" : "border-transparent text-muted hover:text-app"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-12">
        {current === "fabricas" ? (
          <>
            <FactoriesSection />
            <LinesSection />
            <EquipmentModelsSection />
            <SubassembliesSection />
          </>
        ) : null}
        {current === "funcoes" ? (
          <>
            <RolesSection />
            <GradesSection />
          </>
        ) : null}
        {current === "avaliacao" ? (
          <>
            <CompetenciesSection />
            <MatrixCatalogSection />
          </>
        ) : null}
      </div>
    </div>
  );
}
