import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { NotebookIcon } from "../../../design/ui/brand-mark";
import { Button, Card, Field, TextInput } from "../../../design/ui/controls";
import { publicRpPath } from "../model/public-rp";
import { publicCodeFromLink, publicStartTarget, rememberPublicCode } from "../model/public-rp-install";
import { deviceStorage } from "./public-rp-parts";

/**
 * Início do app instalado da página pública (start_url "/rp/abrir"): abre o último link usado no aparelho.
 * Sem link guardado (iPhone guarda o app instalado à parte do Safari), pede para colar o link do WhatsApp.
 * @example <Route path="/rp/abrir" element={<PublicRpStart />} />
 */
export function PublicRpStart() {
  const target = publicStartTarget(deviceStorage());
  if (target) return <Navigate to={target} replace />;
  return <PublicRpLinkPrompt />;
}

function PublicRpLinkPrompt() {
  const navigate = useNavigate();
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const code = publicCodeFromLink(link);
    if (!code) return setError("Cole o link inteiro, que começa com https:// e tem /rp/abrir/.");
    rememberPublicCode(deviceStorage(), code);
    navigate(publicRpPath(code), { replace: true });
  }

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-canvas px-4 py-10 text-app">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5">
          <NotebookIcon className="h-8 w-8 shrink-0 rounded-control" />
          <h1 className="font-serif text-lg font-semibold italic">Relatórios padrões</h1>
        </div>
        <Card className="mt-6">
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <p className="text-sm text-muted">Cole aqui o link da página de RPs que o coordenador mandou no WhatsApp.</p>
            <Field label="Link da página" error={error}>
              <TextInput inputMode="url" value={link} onChange={(event) => setLink(event.target.value)} />
            </Field>
            <Button type="submit">Abrir</Button>
          </form>
        </Card>
        <Link to="/login" className="mt-4 inline-block text-sm text-muted underline">
          Sou o coordenador
        </Link>
      </div>
    </div>
  );
}
