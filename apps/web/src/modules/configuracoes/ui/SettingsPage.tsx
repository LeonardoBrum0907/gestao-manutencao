import { useParams } from "react-router-dom";
import { PageTitle } from "../../../design/ui/controls";
import { TabBar } from "../../../design/ui/tab-bar";
import { AvisosSection } from "../../aviso/ui/AvisosSection";
import { BehaviorTagsSection } from "../../cadastro/ui/BehaviorTagsSection";
import { CompetenciesSection } from "../../cadastro/ui/CompetenciesSection";
import { EquipmentModelsSection } from "../../cadastro/ui/EquipmentModelsSection";
import { FactoriesSection } from "../../cadastro/ui/FactoriesSection";
import { GradesSection } from "../../cadastro/ui/GradesSection";
import { GradeExpectedSection } from "../../competencia/ui/GradeExpectedSection";
import { LinesSection } from "../../cadastro/ui/LinesSection";
import { RolesSection } from "../../cadastro/ui/RolesSection";
import { SubassembliesSection } from "../../cadastro/ui/SubassembliesSection";
import { ModelDocumentsSection } from "../../documentacao/ui/ModelDocumentsSection";
import { MatrixCatalogSection } from "../../competencia/ui/MatrixCatalogSection";

// Cadastros que se arrumam uma vez e pouco mudam: ficam fora do menu, numa página com abas (como no SIGEM).
export const SETTINGS_TABS = [
  { key: "fabricas", label: "Fábricas, linhas e máquinas" },
  { key: "funcoes", label: "Funções e graus" },
  { key: "avaliacao", label: "Avaliação" },
  { key: "avisos", label: "Avisos" },
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
      <TabBar
        label="Abas de configurações"
        tabs={SETTINGS_TABS.map((tab) => ({ key: tab.key, label: tab.label, to: `/configuracoes/${tab.key}` }))}
        current={current}
      />
      <div className="flex flex-col gap-12">
        {current === "fabricas" ? (
          <>
            <FactoriesSection />
            <LinesSection />
            <EquipmentModelsSection />
            <SubassembliesSection />
            <ModelDocumentsSection />
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
            <BehaviorTagsSection />
            <GradeExpectedSection />
            <MatrixCatalogSection />
          </>
        ) : null}
        {current === "avisos" ? <AvisosSection /> : null}
      </div>
    </div>
  );
}
