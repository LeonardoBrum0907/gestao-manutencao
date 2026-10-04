import { useState } from "react";
import type { MemberGradeDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Modal, Notice, PageTitle, TextInput } from "../../../design/ui/controls";
import { useDeleteGrade, useGrades, useSaveGrade } from "../data/cadastro";

export function GradesPage() {
  const grades = useGrades();
  const save = useSaveGrade();
  const remove = useDeleteGrade();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MemberGradeDto | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

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

  function edit(grade: MemberGradeDto) {
    setEditing(grade);
    setName(grade.name);
    setOpen(true);
  }

  return (
    <div>
      <PageTitle
        eyebrow="Apoio"
        title="Graus"
        text="A senioridade do colaborador. Grau em uso não sai da lista."
        action={<Button onClick={create}>Novo grau</Button>}
      />
      {grades.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      <div className="flex flex-col gap-2">
        {grades.data?.length === 0 ? <Card>Nenhum grau ainda.</Card> : null}
        {grades.data?.map((grade) => (
          <Card key={grade.id} compact className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-left font-medium text-app transition hover:text-accent hover:underline"
              onClick={() => edit(grade)}
            >
              {grade.name}
            </button>
            <div className="flex justify-end gap-2">
              {pendingDelete === grade.id ? (
                <>
                  <Button
                    tone="danger"
                    onClick={() =>
                      remove.mutate(grade.id, {
                        onSuccess: () => {
                          setPendingDelete(null);
                          if (editing?.id === grade.id) close();
                        },
                      })
                    }
                  >
                    Confirmar
                  </Button>
                  <Button
                    tone="ghost"
                    onClick={() => {
                      setPendingDelete(null);
                      remove.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  tone="ghost"
                  onClick={() => {
                    remove.reset();
                    setPendingDelete(grade.id);
                  }}
                >
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        ))}
        {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
      </div>
      <Modal open={open} title={editing ? "Editar grau" : "Novo grau"} onClose={close}>
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
