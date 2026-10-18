import { useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { NotebookIcon } from "../../../design/ui/brand-mark";
import { ThemeToggle } from "../../../shell/ui/ThemeToggle";
import { publicRpPath } from "../model/public-rp";

// Buscador que achar o endereço não guarda a página (a API também manda X-Robots-Tag).
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

// Tema azul da página pública (tokens.css): no <html>, para valer também nos menus e avisos que abrem fora da casca.
// A barra do navegador no celular (theme-color) acompanha o azul, lido do próprio token.
function usePublicBrand() {
  useEffect(() => {
    const root = document.documentElement;
    const bar = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const appColor = bar?.content ?? "";
    root.setAttribute("data-brand", "rp-publico");
    if (bar) bar.content = getComputedStyle(root).getPropertyValue("--accent").trim() || appColor;
    return () => {
      root.removeAttribute("data-brand");
      if (bar) bar.content = appColor;
    };
  }, []);
}

/**
 * Casca da página pública de RPs: sem menu nem login, só a marca e o conteúdo, pensada para o celular.
 * @example <Route path="/rp/abrir/:code" element={<PublicRpShell />}>…</Route>
 */
export function PublicRpShell() {
  const { code = "" } = useParams();
  useNoIndex();
  usePublicBrand();
  return (
    <div className="h-full overflow-y-auto bg-canvas text-app">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to={publicRpPath(code)} className="flex items-center gap-2.5">
            <NotebookIcon className="h-8 w-8 shrink-0 rounded-control" />
            <span className="leading-tight">
              <span className="block font-serif text-lg font-semibold italic text-app">Relatórios padrões</span>
              <span className="block text-xs text-muted">Caderno do Gestor · página da equipe</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
