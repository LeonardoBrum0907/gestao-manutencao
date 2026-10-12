import { useState, type ReactNode } from "react";
import { TECH_CARD_DETAIL_FIELDS, TECH_CARD_TYPE_LABELS, type TechCardHit } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Notice } from "../../../design/ui/controls";
import { DetailModal, PanelFooter, PanelSection, PanelTag } from "../../../design/ui/panel";
import { useToast } from "../../../design/ui/toast";
import { useMachines } from "../../cadastro/data/cadastro";
import { techDocumentFileHref, useDeleteTechCard, useSaveTechCard } from "../data/tech-docs";
import { bodyFromValues, emptyCardValues, sourceLabel, valuesFromCard, type ScopeStart, type TechCardFormValues } from "../model/tech-card";
import { TechCardForm } from "./TechCardForm";

type Props = {
  // Ficha existente, ou null para uma nova (que começa em edição).
  card: TechCardHit | null;
  start?: ScopeStart;
  onClose: () => void;
  onSaved?: (card: TechCardHit) => void;
};

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted sm:pt-0.5">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-app">{children}</dd>
    </div>
  );
}

// A ficha em leitura: resumo, campos do tipo e a fonte com o botão de abrir o PDF na página.
function CardView({ card }: { card: TechCardHit }) {
  const details = TECH_CARD_DETAIL_FIELDS[card.type].filter((field) => card.details[field.key]);
  const source = sourceLabel(card);
  return (
    <div className="flex flex-col gap-6">
      {card.summary ? <p className="text-base text-app">{card.summary}</p> : null}
      {details.length ? (
        <dl className="flex flex-col gap-3">
          {details.map((field) => (
            <Fact key={field.key} label={field.label}>
              {card.details[field.key]}
            </Fact>
          ))}
        </dl>
      ) : null}
      <PanelSection title="Onde vale">
        <p className="text-sm text-app">{card.subassemblyName ? `${card.scopeLabel} · ${card.subassemblyName}` : card.scopeLabel}</p>
      </PanelSection>
      <PanelSection
        title="Fonte"
        action={
          card.documentId ? (
            <a href={techDocumentFileHref(card.documentId, card.page)} target="_blank" rel="noopener" className="text-sm font-semibold text-accent hover:underline">
              Abrir PDF{card.page ? ` na p. ${card.page}` : ""}
            </a>
          ) : null
        }
      >
        <p className="text-sm text-app">{source ?? "Sem documento ligado."}</p>
        {card.originalTerm ? <p className="text-xs text-muted">Termo original: {card.originalTerm}</p> : null}
      </PanelSection>
    </div>
  );
}

function CardMeta({ card }: { card: TechCardHit }) {
  return (
    <>
      <PanelTag tone="accent">{TECH_CARD_TYPE_LABELS[card.type].one}</PanelTag>
      {card.code ? <PanelTag>{card.code}</PanelTag> : null}
      {card.deviceTag ? <PanelTag>{card.deviceTag}</PanelTag> : null}
      {card.tags.map((tag) => (
        <PanelTag key={tag}>{tag}</PanelTag>
      ))}
      {card.reviewNeeded ? <PanelTag tone="danger">Precisa de revisão</PanelTag> : null}
    </>
  );
}

function RemoveConfirm({ card, onCancel, onRemoved }: { card: TechCardHit; onCancel: () => void; onRemoved: () => void }) {
  const remove = useDeleteTechCard();
  return (
    <div className="flex flex-col gap-3 rounded-card bg-danger-soft p-4" role="alert">
      <p className="text-sm font-semibold text-app">Excluir a ficha “{card.title}”?</p>
      {remove.isError ? <Notice>{errorMessage(remove.error)}</Notice> : null}
      <div className="flex gap-2">
        <Button tone="danger" disabled={remove.isPending} onClick={() => remove.mutate(card.id, { onSuccess: onRemoved })}>
          Sim, excluir
        </Button>
        <Button tone="ghost" onClick={onCancel}>
          Não
        </Button>
      </div>
    </div>
  );
}

/**
 * Ficha de documentação no modal do centro: leitura com "Abrir PDF", edição e exclusão; nova ficha abre já em edição.
 * @example <TechCardModal card={null} start={{ scopeKind: "machine", targetId: machine.id, lineId: machine.lineId }} onClose={close} />
 */
export function TechCardModal({ card, start, onClose, onSaved }: Props) {
  const machines = useMachines();
  const toast = useToast();
  const save = useSaveTechCard(card?.id);
  const [editing, setEditing] = useState(!card);
  const [removing, setRemoving] = useState(false);
  const machineLineId = machines.data?.find((machine) => machine.id === card?.machineId)?.lineId ?? "";
  const [initial] = useState<TechCardFormValues>(() => (card ? valuesFromCard(card, machineLineId) : emptyCardValues(start)));
  const [values, setValues] = useState(initial);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function submit() {
    save.mutate(bodyFromValues(values), {
      onSuccess: (saved) => {
        toast({ text: card ? "Ficha gravada." : "Ficha criada." });
        onSaved?.(saved);
        onClose();
      },
    });
  }

  return (
    <DetailModal
      open
      eyebrow={card ? (card.subassemblyName ? `${card.scopeLabel} · ${card.subassemblyName}` : card.scopeLabel) : "Nova ficha"}
      title={card ? card.title : "Nova ficha de documentação"}
      meta={card && !editing ? <CardMeta card={card} /> : null}
      onClose={onClose}
      onSubmit={
        editing
          ? (event) => {
              event.preventDefault();
              submit();
            }
          : undefined
      }
      notice={
        <>
          {save.isError ? <Notice>{errorMessage(save.error)}</Notice> : null}
          {card && removing ? (
            <RemoveConfirm
              card={card}
              onCancel={() => setRemoving(false)}
              onRemoved={() => {
                toast({ text: "Ficha excluída." });
                onClose();
              }}
            />
          ) : null}
        </>
      }
      footer={
        editing ? (
          <PanelFooter
            saving={save.isPending}
            saveLabel={card ? "Gravar" : "Criar ficha"}
            dirty={dirty}
            onCancel={card ? () => setEditing(false) : onClose}
            onRemove={card ? () => setRemoving(true) : undefined}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button tone="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        )
      }
    >
      {editing || !card ? <TechCardForm values={values} onChange={setValues} /> : <CardView card={card} />}
    </DetailModal>
  );
}
