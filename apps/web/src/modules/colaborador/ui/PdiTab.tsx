import { useState } from "react";
import type { MemberDto, MemberPdiDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, controlClass } from "../../../design/ui/controls";
import { useAddPdiFile, usePdi, useRemovePdiFile } from "../data/pdi";
import { PdiItems } from "./PdiItems";

function Files({ member, pdi }: { member: MemberDto; pdi: MemberPdiDto }) {
  const add = useAddPdiFile(member.id);
  const remove = useRemovePdiFile(member.id);
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  return (
    <Card>
      <h2 className="text-sm font-semibold text-app">Anexos do PDI</h2>
      <p className="mt-1 text-sm text-muted">Plano de desenvolvimento, certificados, avaliações assinadas. Até 10 MB por arquivo.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {pdi.attachments.length === 0 ? <li className="text-sm text-muted">Nenhum arquivo.</li> : null}
        {pdi.attachments.map((attachment) => (
          <li key={attachment.id} className="flex items-center justify-between gap-3 text-sm">
            <a
              className="min-w-0 truncate font-medium text-accent hover:underline focus:underline"
              href={`/api/members/${member.id}/pdi/attachments/${attachment.id}`}
            >
              {attachment.fileName}
            </a>
            <Button tone="ghost" className="shrink-0" disabled={remove.isPending} onClick={() => remove.mutate(attachment.id)}>
              Remover
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          key={inputKey}
          type="file"
          aria-label="Arquivo do PDI"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className={`${controlClass} file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-app`}
        />
        <Button
          tone="ghost"
          disabled={!file || add.isPending}
          onClick={() => {
            if (!file) return;
            add.mutate(file, {
              onSuccess: () => {
                setFile(null);
                setInputKey((value) => value + 1);
              },
            });
          }}
        >
          Anexar
        </Button>
      </div>
      {add.isError ? <Notice>{errorMessage(add.error)}</Notice> : null}
      {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
    </Card>
  );
}

export function PdiTab({ member }: { member: MemberDto }) {
  const pdi = usePdi(member.id);
  if (pdi.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (pdi.isError) return <Notice>{errorMessage(pdi.error)}</Notice>;
  return (
    <div className="flex flex-col gap-6">
      <PdiItems member={member} />
      <Files member={member} pdi={pdi.data} />
    </div>
  );
}
