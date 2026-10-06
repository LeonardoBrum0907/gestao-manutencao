import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { RpDraftDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, PageTitle, TextArea } from "../../../design/ui/controls";
import { useParseRp } from "../data/rp";
import { valuesFromRp } from "../model/rp";
import { RpForm } from "./RpForm";

export function RpPastePage() {
  const navigate = useNavigate();
  const parse = useParseRp();
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<RpDraftDto[] | null>(null);
  const [index, setIndex] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  function interpret() {
    parse.mutate(text, {
      onSuccess: (found) => {
        setDrafts(found);
        setIndex(0);
        setSavedCount(0);
      },
    });
  }

  function next(saved: boolean) {
    if (saved) setSavedCount((count) => count + 1);
    if (drafts && index + 1 < drafts.length) setIndex(index + 1);
    else navigate("/rp");
  }

  const draft = drafts?.[index];
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        eyebrow="Turno"
        title="Colar RP"
        text="Cole o Relatório Padrão do WhatsApp. O sistema preenche a ficha e você confere antes de salvar. Pode colar mais de um de uma vez."
      />
      <Link to="/rp" className="-mt-4 mb-6 inline-flex text-sm font-semibold text-accent">
        ← RPs
      </Link>
      {!drafts ? (
        <Card>
          <div className="flex flex-col gap-4">
            <Field label="Texto do relatório">
              <TextArea
                className="min-h-72 font-mono"
                value={text}
                placeholder="*RELATÓRIO PADRÃO – MANUTENÇÃO*&#10;*DATA:* 04/10/2026&#10;…"
                onChange={(event) => setText(event.target.value)}
              />
            </Field>
            {parse.isError ? <Notice>{errorMessage(parse.error)}</Notice> : null}
            <div>
              <Button onClick={interpret} disabled={!text.trim() || parse.isPending}>
                {parse.isPending ? "Interpretando…" : "Interpretar"}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
      {draft && drafts ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-app">
              Relatório {index + 1} de {drafts.length}
              {savedCount ? <span className="font-normal text-muted"> · {savedCount} salvo(s)</span> : null}
            </p>
            <Button tone="ghost" onClick={() => setDrafts(null)}>
              Voltar ao texto
            </Button>
          </div>
          <RpForm
            key={`${index}-${draft.rawText.length}`}
            initial={valuesFromRp(draft)}
            rawText={draft.rawText}
            warnings={draft.warnings}
            submitLabel={index + 1 < drafts.length ? "Salvar e ir para o próximo" : "Salvar RP"}
            onSaved={() => next(true)}
            onSkip={() => next(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
