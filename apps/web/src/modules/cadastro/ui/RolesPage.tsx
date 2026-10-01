import { useState } from "react";
import type { TechnicianRoleDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, TextInput } from "../../../design/ui/controls";
import { useRoles, useSaveRole } from "../data/cadastro";

export function RolesPage() {
  const roles = useRoles();
  const save = useSaveRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TechnicianRoleDto | null>(null);
  const [name, setName] = useState("");

  function close() {
    setOpen(false);
    setEditing(null);
    setName("");
  }

  function create() {
    setEditing(null);
    setName("");
    setOpen(true);
  }

  function edit(role: TechnicianRoleDto) {
    setEditing(role);
    setName(role.name);
    setOpen(true);
  }

  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Funções"
        text="As funções do técnico. As seis do SIGEM já estão na lista."
        action={<Button onClick={create}>Nova função</Button>}
      />
      {roles.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {roles.data?.length === 0 ? <Card>Nenhuma função ainda.</Card> : null}
        {roles.data?.map((role) => (
          <Card key={role.id} compact>
            <button
              type="button"
              className="text-left font-medium text-app transition hover:text-accent hover:underline"
              onClick={() => edit(role)}
            >
              {role.name}
            </button>
          </Card>
        ))}
      </div>
      <Modal open={open} title={editing ? "Editar função" : "Nova função"} onClose={close}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing?.id, name }, { onSuccess: close });
          }}
        >
          <Field label="Nome">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending}>
              Gravar
            </Button>
            <Button tone="ghost" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
