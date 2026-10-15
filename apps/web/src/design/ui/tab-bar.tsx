import { Link } from "react-router-dom";

export type TabLink = { key: string; label: string; to: string };

/**
 * Faixa de abas de uma página (Configurações, ficha do colaborador): cada aba é um link, a atual fica sublinhada.
 * @example <TabBar label="Abas de configurações" tabs={tabs} current="avisos" />
 */
export function TabBar({ label, tabs, current }: { label: string; tabs: TabLink[]; current: string }) {
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          aria-current={current === tab.key ? "page" : undefined}
          className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            current === tab.key ? "border-accent text-app" : "border-transparent text-muted hover:text-app"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
