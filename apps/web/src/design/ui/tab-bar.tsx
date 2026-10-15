import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { tabBarScrollLeft, type TabSpan } from "./tab-scroll";

export type TabLink = { key: string; label: string; to: string };

/**
 * Faixa de abas de uma página (Configurações, ficha do colaborador): cada aba é um link, a atual fica sublinhada.
 * @example <TabBar label="Abas de configurações" tabs={tabs} current="avisos" />
 */
export function TabBar({ label, tabs, current }: { label: string; tabs: TabLink[]; current: string }) {
  const navRef = useRef<HTMLElement>(null);
  // No celular a faixa rola de lado: quem chega por link direto (ex.: /configuracoes/avisos) precisa ver a aba atual.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active) nav.scrollLeft = tabBarScrollLeft(nav.scrollLeft, nav.clientWidth, tabSpan(nav, active));
  }, [current]);

  return (
    <nav ref={navRef} aria-label={label} className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
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

// Início e fim da aba medidos a partir do começo do conteúdo rolável da faixa.
function tabSpan(nav: HTMLElement, tab: HTMLElement): TabSpan {
  const start = tab.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
  return { start, end: start + tab.getBoundingClientRect().width };
}
