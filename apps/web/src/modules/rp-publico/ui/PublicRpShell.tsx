import { useEffect } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { NotebookIcon } from "../../../design/ui/brand-mark";
import { ThemeToggle } from "../../../shell/ui/ThemeToggle";
import { publicRpPath } from "../model/public-rp";
import { rememberPublicCode } from "../model/public-rp-install";
import { deviceStorage } from "./public-rp-parts";

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

/**
 * Casca da página pública de RPs: sem menu nem login, só a marca e o conteúdo, pensada para o celular.
 * @example <Route path="/rp/abrir/:code" element={<PublicRpShell />}>…</Route>
 */
export function PublicRpShell() {
  const { code = "" } = useParams();
  useNoIndex();
  // Guarda o link para o login oferecer a volta aos RPs (app instalado antes do manifesto por link).
  useEffect(() => rememberPublicCode(deviceStorage(), code), [code]);
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
