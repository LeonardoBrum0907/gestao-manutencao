import { useState, type FormEvent } from "react";
import { TECH_DOCUMENT_KINDS, TECH_DOCUMENT_KIND_LABELS, type TechDocumentDto, type TechDocumentKind } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Field, Notice, SectionTitle, SelectInput, TextInput, controlClass } from "../../../design/ui/controls";
import { DataTable, type TableColumn } from "../../../design/ui/data-table";
import { RemoveDialog } from "../../../design/ui/removal";
import { useToast } from "../../../design/ui/toast";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { techDocumentFileHref, useDeleteTechDocument, useTechDocuments, useUploadTechDocument } from "../data/tech-docs";
import { formatBytes } from "../model/tech-card";

type UploadDraft = { file: File | null; name: string; kind: TechDocumentKind; revision: string };

const emptyDraft: UploadDraft = { file: null, name: "", kind: "other", revision: "" };

// Nome sugerido a partir do arquivo, sem a extensão.
function nameFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function UploadForm({ equipmentId }: { equipmentId: string }) {
  const upload = useUploadTechDocument();
  const toast = useToast();
  const [draft, setDraft] = useState<UploadDraft>(emptyDraft);
  const [inputKey, setInputKey] = useState(0);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.file) return;
    upload.mutate(
      { equipmentId, name: draft.name, kind: draft.kind, revision: draft.revision || null, file: draft.file },
      {
        onSuccess: (document) => {
          toast({ text: `${document.name} enviado.` });
          setDraft(emptyDraft);
          setInputKey((value) => value + 1);
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 border-t border-line pt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Arquivo (PDF ou imagem, até 200 MB)">
          <input
            key={inputKey}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className={`${controlClass} file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-app`}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setDraft((current) => ({ ...current, file, name: current.name || (file ? nameFromFile(file) : "") }));
            }}
          />
        </Field>
        <Field label="Nome">
          <TextInput value={draft.name} required onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </Field>
        <Field label="Tipo">
          <SelectInput value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as TechDocumentKind })}>
            {TECH_DOCUMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {TECH_DOCUMENT_KIND_LABELS[kind]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Revisão (opcional)">
          <TextInput value={draft.revision} placeholder="Ex.: Version 1" onChange={(event) => setDraft({ ...draft, revision: event.target.value })} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!draft.file || !draft.name.trim() || upload.isPending}>
          {upload.isPending ? "Enviando…" : "Enviar documento"}
        </Button>
        {upload.isError ? <Notice>{errorMessage(upload.error)}</Notice> : null}
      </div>
    </form>
  );
}

// O nome abre o arquivo em outra guia; o navegador mostra o PDF em vez de baixar.
const DOCUMENT_COLUMNS: TableColumn<TechDocumentDto>[] = [
  {
    key: "name",
    header: "Documento",
    cell: (row) => (
      <a href={techDocumentFileHref(row.id, null)} target="_blank" rel="noopener" className="font-medium text-accent hover:underline">
        {row.name}
      </a>
    ),
    sortValue: (row) => row.name,
    wrap: "long",
  },
  { key: "kind", header: "Tipo", cell: (row) => TECH_DOCUMENT_KIND_LABELS[row.kind], sortValue: (row) => TECH_DOCUMENT_KIND_LABELS[row.kind] },
  { key: "file", header: "Arquivo", cell: (row) => `${row.fileName} · ${formatBytes(row.size)}`, wrap: "short", className: "text-muted" },
  { key: "revision", header: "Revisão", cell: (row) => row.revision ?? "—" },
  { key: "cards", header: "Fichas", cell: (row) => row.cardCount, sortValue: (row) => row.cardCount, align: "right" },
];

/**
 * Configurações › Fábricas, linhas e máquinas › Documentos do modelo: os PDFs de cada modelo de equipamento,
 * guardados no servidor; as fichas apontam para eles e a página.
 */
export function ModelDocumentsSection() {
  const catalog = useMatrixCatalog();
  const documents = useTechDocuments();
  const remove = useDeleteTechDocument();
  const toast = useToast();
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived);
  const [chosen, setChosen] = useState("");
  const [removing, setRemoving] = useState<TechDocumentDto | null>(null);
  const equipmentId = chosen || equipments[0]?.id || "";
  const rows = (documents.data ?? []).filter((document) => document.equipmentId === equipmentId);

  return (
    <div>
      <SectionTitle
        title="Documentos técnicos"
        text="Manuais, catálogos de peças e esquemas elétricos de cada modelo, guardados no servidor. As fichas da documentação apontam para o documento e a página, e “abrir” já cai na página certa."
      />
      {catalog.isPending || documents.isPending ? <p className="text-sm text-muted">Carregando…</p> : null}
      {documents.isError ? <Notice>{errorMessage(documents.error)}</Notice> : null}
      {catalog.data && equipments.length === 0 ? <Card>Nenhum modelo ativo. Cadastre o modelo em “Modelos de equipamento”, acima.</Card> : null}
      {equipments.length > 0 ? (
        <Card className="flex flex-col gap-4">
          <div className="sm:max-w-sm">
            <Field label="Modelo de equipamento">
              <SelectInput value={equipmentId} onChange={(event) => setChosen(event.target.value)}>
                {equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          {rows.length ? (
            <DataTable
              plain
              label="Documentos"
              rows={rows}
              rowKey={(row) => row.id}
              columns={DOCUMENT_COLUMNS}
              stacked={(row) => ({ eyebrow: TECH_DOCUMENT_KIND_LABELS[row.kind], title: row.name, meta: `${formatBytes(row.size)} · ${row.cardCount} fichas` })}
              menu={(row) => ({ label: `Ações de ${row.name}`, items: [{ label: "Excluir…", onSelect: () => setRemoving(row) }] })}
            />
          ) : (
            <p className="text-sm text-muted">Nenhum documento neste modelo ainda.</p>
          )}
          <UploadForm key={equipmentId} equipmentId={equipmentId} />
        </Card>
      ) : null}
      {removing ? (
        <RemoveDialog
          path={`/api/tech-documents/${removing.id}`}
          name={removing.name}
          removing={remove.isPending}
          error={remove.error}
          onCancel={() => {
            setRemoving(null);
            remove.reset();
          }}
          onConfirm={() =>
            remove.mutate(removing.id, {
              onSuccess: () => {
                toast({ text: `${removing.name} excluído.` });
                setRemoving(null);
              },
            })
          }
        />
      ) : null}
    </div>
  );
}
