import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TECH_CARD_TYPES, TECH_CARD_TYPE_LABELS, type MachineDto } from "@manutencao/shared";
import { Button, Card, SectionTitle, TextInput } from "../../../design/ui/controls";
import { useTechCardSummary } from "../data/tech-docs";
import { TechCardModal } from "./TechCardModal";

/**
 * Bloco "Documentação técnica" da tela da máquina: busca já filtrada nela, contagem por tipo e "Nova ficha".
 * Contam as fichas da máquina, do modelo dela e da linha.
 * @example <MachineDocsCard machine={machine} />
 */
export function MachineDocsCard({ machine }: { machine: MachineDto }) {
  const navigate = useNavigate();
  const summary = useTechCardSummary(machine.id);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const base = `/documentacao?machineId=${machine.id}`;

  function search(event: FormEvent) {
    event.preventDefault();
    navigate(`${base}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <Card>
      <SectionTitle
        title="Documentação técnica"
        action={
          <Link to={base} className="text-sm font-semibold text-accent hover:underline">
            Ver tudo
          </Link>
        }
      />
      <form onSubmit={search} className="flex gap-2">
        <TextInput type="search" aria-label="Buscar na documentação desta máquina" value={query} placeholder="Código, peça, termo…" onChange={(event) => setQuery(event.target.value)} />
        <Button type="submit" tone="ghost">
          Buscar
        </Button>
      </form>
      {summary.isPending ? <p className="mt-3 text-sm text-muted">Carregando…</p> : null}
      {summary.data ? (
        <table className="mt-3 w-full text-sm">
          <tbody>
            {TECH_CARD_TYPES.map((type) => (
              <tr key={type} className="border-t border-line">
                <td className="py-1.5">
                  <Link to={`${base}&type=${type}`} className="text-app hover:text-accent">
                    {TECH_CARD_TYPE_LABELS[type].many}
                  </Link>
                </td>
                <td className={`py-1.5 text-right tabular-nums ${summary.data.counts[type] ? "font-semibold text-app" : "text-muted"}`}>{summary.data.counts[type]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="ghost" onClick={() => setCreating(true)}>
          Nova ficha
        </Button>
      </div>
      {creating ? (
        <TechCardModal card={null} start={{ scopeKind: "machine", targetId: machine.id, lineId: machine.lineId }} onClose={() => setCreating(false)} />
      ) : null}
    </Card>
  );
}
