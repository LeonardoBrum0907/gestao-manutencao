import { useState, type FormEvent } from "react";
import type { MemberDto, RpSupervisorLinkDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, SectionTitle, SelectInput } from "../../../design/ui/controls";
import { useToast } from "../../../design/ui/toast";
import { useMembers } from "../../cadastro/data/cadastro";
import { useCreateSupervisorLink, useReplaceSupervisorLink, useRevokeSupervisorLink, useSupervisorLinks } from "../data/rp-supervisor-links";
import { publicRpUrl } from "../model/public-rp";
import { supervisorChoices } from "../model/supervisor-links";
import { copyText } from "./public-rp-parts";

type Confirming = "replace" | "revoke";

const CONFIRM_TEXT: Record<Confirming, { question: string; yes: string }> = {
  replace: { question: "O link de agora para de abrir. Mande o novo para o supervisor.", yes: "Sim, trocar" },
  revoke: { question: "Este supervisor perde o acesso. Os RPs que ele avaliou ficam como estão.", yes: "Sim, remover" },
};

function ConfirmRow({ confirming, busy, onYes, onNo }: { confirming: Confirming; busy: boolean; onYes: () => void; onNo: () => void }) {
  const text = CONFIRM_TEXT[confirming];
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-app">
      {text.question}
      <Button tone="danger" disabled={busy} onClick={onYes}>
        {text.yes}
      </Button>
      <Button tone="ghost" onClick={onNo}>
        Não
      </Button>
    </div>
  );
}

function SupervisorLinkActions({ link }: { link: RpSupervisorLinkDto }) {
  const toast = useToast();
  const replace = useReplaceSupervisorLink();
  const revoke = useRevokeSupervisorLink();
  const [confirming, setConfirming] = useState<Confirming | null>(null);
  const url = publicRpUrl(window.location.origin, link.code);
  const run = (action: Confirming) => (action === "replace" ? replace : revoke).mutate(link.id, { onSettled: () => setConfirming(null) });
  if (confirming) {
    return <ConfirmRow confirming={confirming} busy={replace.isPending || revoke.isPending} onYes={() => run(confirming)} onNo={() => setConfirming(null)} />;
  }
  const copy = () => void copyText(url).then((ok) => toast({ text: ok ? `Link de ${link.name} copiado. Mande só para ele.` : "Não deu para copiar." }));
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={copy}>Copiar link</Button>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-control border border-line bg-chip px-4 py-2.5 text-sm font-semibold text-app transition hover:bg-accent-soft">
        Abrir
      </a>
      <Button tone="ghost" onClick={() => setConfirming("replace")}>Trocar link</Button>
      <Button tone="ghost" onClick={() => setConfirming("revoke")}>Remover</Button>
    </div>
  );
}

// Supervisor é quem tem função que lidera equipe (Configurações › Funções); quem já tem link sai da lista.
function NewSupervisorForm({ choices, hasLinks }: { choices: MemberDto[]; hasLinks: boolean }) {
  const create = useCreateSupervisorLink();
  const [memberId, setMemberId] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate(memberId, { onSuccess: () => setMemberId("") });
  }
  if (!choices.length) {
    return (
      <p className="text-sm text-muted">
        {hasLinks ? "Todos os supervisores já têm link." : "Nenhum supervisor no cadastro. Em Configurações › Funções, marque “Lidera equipe” na função deles."}
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[12rem] flex-1">
          <SelectInput aria-label="Supervisor" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
            <option value="">Escolha o supervisor</option>
            {choices.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </SelectInput>
        </div>
        <Button type="submit" disabled={!memberId || create.isPending}>
          Criar link
        </Button>
      </div>
      {create.error ? <Notice>{errorMessage(create.error)}</Notice> : null}
    </form>
  );
}

/**
 * Configurações › Página pública: um link por supervisor, escolhido entre os supervisores do cadastro. Só esse link aprova, recusa, pede revisão e exporta,
 * e o histórico do RP mostra o nome de quem fez (escolha do Léo em vez de login de supervisor).
 * @example {current === "rp-publico" ? <SupervisorLinksSection /> : null}
 */
export function SupervisorLinksSection() {
  const links = useSupervisorLinks();
  const members = useMembers();
  const choices = supervisorChoices(members.data ?? [], links.data ?? []);
  return (
    <section>
      <SectionTitle
        title="Links dos supervisores"
        text="Cada supervisor recebe o seu. Ele vê o mesmo que a equipe e ainda aprova, recusa, pede revisão e exporta a planilha."
      />
      <Card>
        <div className="flex flex-col gap-4">
          {links.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
          {links.error ? <Notice>{errorMessage(links.error)}</Notice> : null}
          {links.data?.length === 0 ? <p className="text-sm text-muted">Nenhum supervisor ainda.</p> : null}
          {links.data?.map((link) => (
            <div key={link.id} className="flex flex-col gap-2 border-b border-line pb-4">
              <p className="text-sm font-semibold text-app">{link.name}</p>
              <SupervisorLinkActions link={link} />
            </div>
          ))}
          {links.isSuccess && members.isSuccess ? <NewSupervisorForm choices={choices} hasLinks={links.data.length > 0} /> : null}
        </div>
      </Card>
    </section>
  );
}
