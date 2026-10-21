import { Link } from "react-router-dom";
import { Card } from "../../../design/ui/controls";
import { publicStartTarget } from "../model/public-rp-install";
import { deviceStorage } from "./public-rp-parts";

/**
 * Atalho no login para quem já abriu a página de RPs neste aparelho. O app instalado antes do manifesto
 * próprio da página pública abre no início ("/") e, sem login, cai aqui: o técnico volta aos RPs com um toque.
 * @example <PublicRpShortcut />
 */
export function PublicRpShortcut() {
  const target = publicStartTarget(deviceStorage());
  if (!target) return null;
  return (
    <Card compact className="mt-6">
      <p className="text-sm text-muted">É da equipe e não tem senha?</p>
      <Link to={target} replace className="mt-1 inline-block text-sm font-semibold text-accent underline">
        Abrir a página de RPs da equipe
      </Link>
    </Card>
  );
}
