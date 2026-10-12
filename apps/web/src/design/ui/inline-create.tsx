import { useState } from "react";
import { errorMessage } from "../../app/http";
import { Button, Notice, TextInput } from "./controls";

export type InlineCreateProps = {
  // Texto do link que abre o campo, ex.: "+ Novo modelo".
  label: string;
  inputLabel: string;
  placeholder: string;
  pending: boolean;
  error: unknown;
  // Resolve quando criou; rejeita para manter o campo aberto com o erro.
  onCreate: (name: string) => Promise<unknown>;
};

/**
 * Link "+ Novo …" que vira um campo com Criar e Cancelar, para cadastrar algo sem sair do formulário.
 * Enter no campo cria (sem enviar o formulário de fora).
 * @example <InlineCreate label="+ Nova versão" inputLabel="Nome da nova versão" placeholder="Ex.: NMX" pending={save.isPending} error={save.error} onCreate={(name) => save.mutateAsync({ name })} />
 */
export function InlineCreate({ label, inputLabel, placeholder, pending, error, onCreate }: InlineCreateProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="self-start text-sm font-semibold text-accent hover:underline" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  function create() {
    onCreate(name).then(
      () => {
        setName("");
        setOpen(false);
      },
      // O erro aparece pelo `error` de quem chama.
      () => undefined,
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <TextInput
          autoFocus
          aria-label={inputLabel}
          value={name}
          placeholder={placeholder}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            create();
          }}
        />
        <Button tone="ghost" disabled={pending} onClick={create}>
          Criar
        </Button>
        <Button tone="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
      {error ? <Notice>{errorMessage(error)}</Notice> : null}
    </div>
  );
}
