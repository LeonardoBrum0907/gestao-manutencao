import { useState } from "react";
import type { RpDraftDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, TextArea } from "../../../design/ui/controls";
import { useParsePublicRp } from "../data/public-rp";

type PastePanelProps = { code: string; onRead: (draft: RpDraftDto, warnings: string[]) => void };

// Colado mais de um relatório: preenche o primeiro e avisa, para o técnico gravar um de cada vez.
function warningsOf(drafts: RpDraftDto[]): string[] {
  const extra = drafts.length > 1 ? [`O texto tem ${drafts.length} relatórios: preenchi o primeiro. Cole os outros depois de gravar.`] : [];
  return [...extra, ...drafts[0]!.warnings];
}

/**
 * Atalho do novo RP: o técnico cola o relatório que já mandou no WhatsApp e o formulário vem preenchido para conferir.
 * @example <PastePanel code={code} onRead={(draft, warnings) => preencher(draft, warnings)} />
 */
export function PastePanel({ code, onRead }: PastePanelProps) {
  const parse = useParsePublicRp(code);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  function read() {
    parse.mutate(text, {
      onSuccess: (drafts) => {
        if (!drafts.length) return;
        onRead(drafts[0]!, warningsOf(drafts));
        setOpen(false);
      },
    });
  }

  if (!open) {
    return (
      <Button tone="ghost" className="self-start" onClick={() => setOpen(true)}>
        Colar do WhatsApp
      </Button>
    );
  }
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <Field label="Texto do RP que você mandou no WhatsApp">
          <TextArea className="min-h-56 font-mono" value={text} placeholder="*RELATÓRIO PADRÃO – MANUTENÇÃO*&#10;*DATA:* 04/10/2026&#10;…" onChange={(event) => setText(event.target.value)} />
        </Field>
        {parse.isError ? <Notice>{errorMessage(parse.error)}</Notice> : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={read} disabled={!text.trim() || parse.isPending}>
            {parse.isPending ? "Lendo…" : "Preencher o formulário"}
          </Button>
          <Button tone="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Avisos da leitura (técnico ou linha que não achou), para conferir antes de gravar.
 * @example {warnings.length ? <PasteWarnings warnings={warnings} /> : null}
 */
export function PasteWarnings({ warnings }: { warnings: string[] }) {
  return (
    <ul className="flex flex-col gap-1 rounded-control bg-chip p-3 text-sm text-app">
      <li className="font-semibold">Preenchido com o texto colado. Confira antes de gravar.</li>
      {warnings.map((warning) => (
        <li key={warning}>⚠ {warning}</li>
      ))}
    </ul>
  );
}
