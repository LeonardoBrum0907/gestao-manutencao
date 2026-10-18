import { useState } from "react";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, SectionTitle, TextInput } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useMembers } from "../../cadastro/data/cadastro";
import { useDisableRpPublicLink, useReplaceRpPublicLink, useRpPublicLink } from "../data/rp-public-admin";
import { publicRpUrl } from "../model/public-rp";
import { copyText } from "./public-rp-parts";

function LinkActions({ url, onReplace, onDisable, busy }: { url: string; onReplace: () => void; onDisable: () => void; busy: boolean }) {
  const toast = useToast();
  const [confirm, setConfirm] = useState<"replace" | "disable" | null>(null);
  function confirmed() {
    if (confirm === "replace") onReplace();
    else onDisable();
    setConfirm(null);
  }
  if (confirm) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm text-app">
        {confirm === "replace" ? "O link de agora para de abrir. Quem tem ele vai precisar do novo." : "A página pública para de abrir até você gerar outro link."}
        <Button tone="danger" disabled={busy} onClick={confirmed}>
          {confirm === "replace" ? "Sim, trocar" : "Sim, desligar"}
        </Button>
        <Button tone="ghost" onClick={() => setConfirm(null)}>
          Não
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => void copyText(url).then((ok) => toast({ text: ok ? "Link copiado. Cole no WhatsApp da equipe." : "Não deu para copiar: selecione o endereço." }))}>
        Copiar link
      </Button>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft">
        Abrir
      </a>
      <Button tone="ghost" onClick={() => setConfirm("replace")}>
        Trocar link
      </Button>
      <Button tone="ghost" onClick={() => setConfirm("disable")}>
        Desligar
      </Button>
    </div>
  );
}

function EnabledMembers() {
  const members = useMembers();
  const enabled = (members.data ?? []).filter((member) => member.publicRp);
  return (
    <p className="text-sm text-muted">
      {enabled.length
        ? `Técnicos no formulário: ${enabled.map((member) => member.name).join(", ")}.`
        : "Nenhum técnico liberado ainda: o formulário não grava sem técnico."}{" "}
      Libere cada um na ficha do colaborador, em "Aparece no RP público".
    </p>
  );
}

/**
 * Configurações › Página pública: gerar, copiar, trocar e desligar o link da página pública de RPs.
 * @example {current === "rp-publico" ? <PublicRpLinkSection /> : null}
 */
export function PublicRpLinkSection() {
  const state = useRpPublicLink();
  const replace = useReplaceRpPublicLink();
  const disable = useDisableRpPublicLink();
  const link = state.data?.link ?? null;
  const url = link ? publicRpUrl(window.location.origin, link.code) : "";
  const error = state.error ?? replace.error ?? disable.error;
  return (
    <section>
      <SectionTitle
        title="Página pública de RPs"
        text="Sem login: quem tem o link vê, cria e edita os RPs feitos nela. Aprovar, recusar, pedir revisão e exportar só pelo link de um supervisor. Os RPs colados no app não aparecem lá."
      />
      <Card>
        <div className="flex flex-col gap-4">
          {state.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
          {state.isSuccess && !link ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-app">A página pública está desligada.</p>
              <Button disabled={replace.isPending} onClick={() => replace.mutate()}>
                Gerar link
              </Button>
            </div>
          ) : null}
          {link ? (
            <>
              <TextInput readOnly aria-label="Link da página pública" value={url} onFocus={(event) => event.currentTarget.select()} />
              <LinkActions url={url} busy={replace.isPending || disable.isPending} onReplace={() => replace.mutate()} onDisable={() => disable.mutate()} />
            </>
          ) : null}
          {error ? <Notice>{errorMessage(error)}</Notice> : null}
          <EnabledMembers />
        </div>
      </Card>
    </section>
  );
}
