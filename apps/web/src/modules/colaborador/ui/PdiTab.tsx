import { useState } from "react";
import { Link } from "react-router-dom";
import type { MachineDto, MemberDto, MemberPdiDto } from "@manutencao/shared";
import { errorMessage } from "../../../app/http";
import { Button, Card, Notice, TextInput, controlClass } from "../../../design/ui/controls";
import { useFactories, useMachines } from "../../cadastro/data/cadastro";
import { useRecords } from "../../registro/data/records";
import { recordShortName, statusChipClass, statusLabel } from "../../registro/model/record";
import { useAddPdiFile, usePdi, useRemovePdiFile, useSetPdiMachines } from "../data/pdi";

type Kind = "sponsor" | "development";

const columns: { kind: Kind; title: string; text: string; other: string }[] = [
  { kind: "sponsor", title: "Padrinho de", text: "Máquinas pelas quais responde.", other: "em desenvolvimento" },
  { kind: "development", title: "Em desenvolvimento", text: "Máquinas que está aprendendo no PDI.", other: "de padrinho" },
];

function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function MachinePicker({
  pdi,
  machines,
  factoryName,
  onChange,
  disabled,
}: {
  pdi: MemberPdiDto;
  machines: MachineDto[];
  factoryName: Map<string, string>;
  onChange: (next: { sponsor: string[]; development: string[] }) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const chosen: Record<Kind, string[]> = { sponsor: pdi.sponsorMachineIds, development: pdi.developmentMachineIds };
  const visible = machines.filter((machine) => fold(machine.name).includes(fold(query.trim())));

  function toggle(kind: Kind, machineId: string) {
    const list = chosen[kind].includes(machineId) ? chosen[kind].filter((id) => id !== machineId) : [...chosen[kind], machineId];
    onChange({ ...chosen, [kind]: list });
  }

  return (
    <div className="flex flex-col gap-3">
      {machines.length > 8 ? (
        <TextInput aria-label="Buscar máquina" placeholder="Buscar máquina" value={query} onChange={(event) => setQuery(event.target.value)} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {columns.map((column) => {
          const otherKind: Kind = column.kind === "sponsor" ? "development" : "sponsor";
          return (
            <fieldset key={column.kind} className="min-w-0">
              <legend className="text-sm font-semibold text-app">
                {column.title} <span className="font-normal text-muted">({chosen[column.kind].length})</span>
              </legend>
              <p className="mt-1 text-xs text-muted">{column.text}</p>
              <ul className="mt-2 max-h-72 overflow-y-auto rounded-control border border-line bg-surface p-1">
                {visible.length === 0 ? <li className="px-2 py-2 text-sm text-muted">Nenhuma máquina.</li> : null}
                {visible.map((machine) => {
                  const taken = chosen[otherKind].includes(machine.id);
                  return (
                    <li key={machine.id}>
                      <label
                        className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-sm ${
                          taken ? "text-muted" : "cursor-pointer text-app hover:bg-chip"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--accent)]"
                          checked={chosen[column.kind].includes(machine.id)}
                          disabled={disabled || taken}
                          onChange={() => toggle(column.kind, machine.id)}
                        />
                        <span className="min-w-0 truncate">
                          {machine.name}
                          <span className="text-muted"> · {factoryName.get(machine.factoryId) ?? "—"}</span>
                          {taken ? <span className="text-muted"> · {column.other}</span> : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

function SponsoredOpen({ machineIds, machineName }: { machineIds: string[]; machineName: Map<string, string> }) {
  const records = useRecords();
  const open = (records.data ?? []).filter(
    (record) => record.machineId !== null && machineIds.includes(record.machineId) && record.status !== "done",
  );
  if (!machineIds.length) return null;
  return (
    <section className="overflow-hidden rounded-card border border-line bg-card shadow-card">
      <h2 className="px-4 py-3 text-sm font-semibold text-app">
        Em aberto nas máquinas que apadrinha <span className="font-normal text-muted">({open.length})</span>
      </h2>
      {open.length === 0 ? <p className="border-t border-t-line px-4 py-3 text-sm text-muted">Nada em aberto nessas máquinas.</p> : null}
      <ul>
        {open.map((record) => (
          <li key={record.id}>
            <Link
              to={`/registros/${record.id}`}
              className="flex items-start justify-between gap-3 border-t border-t-line px-4 py-3 transition hover:bg-accent-soft"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {recordShortName(record.type)} · {record.machineId ? machineName.get(record.machineId) : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-app">{record.body}</p>
              </div>
              <span className={`shrink-0 ${statusChipClass(record.status)}`}>{statusLabel(record.status)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  const setMachines = useSetPdiMachines(member.id);
  const machines = useMachines();
  const factories = useFactories();
  const factoryName = new Map((factories.data ?? []).map((factory) => [factory.id, factory.name]));
  const machineName = new Map((machines.data ?? []).map((machine) => [machine.id, machine.name]));
  if (pdi.isPending || machines.isPending) return <p className="text-sm text-muted">Carregando…</p>;
  if (pdi.isError) return <Notice>{errorMessage(pdi.error)}</Notice>;
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-sm font-semibold text-app">Máquinas</h2>
        <p className="mt-1 text-sm text-muted">Grava ao marcar. A mesma máquina não fica nas duas listas.</p>
        <div className="mt-4">
          {machines.data?.length ? (
            <MachinePicker
              pdi={pdi.data}
              machines={machines.data}
              factoryName={factoryName}
              onChange={(next) => setMachines.mutate(next)}
              disabled={setMachines.isPending}
            />
          ) : (
            <p className="text-sm text-muted">
              Nenhuma máquina cadastrada.{" "}
              <Link to="/configuracoes/fabricas" className="font-medium text-accent hover:underline">
                Cadastrar máquinas
              </Link>
            </p>
          )}
        </div>
        {setMachines.isError ? (
          <div className="mt-3">
            <Notice>{errorMessage(setMachines.error)}</Notice>
          </div>
        ) : null}
      </Card>
      <SponsoredOpen machineIds={pdi.data.sponsorMachineIds} machineName={machineName} />
      <Files member={member} pdi={pdi.data} />
    </div>
  );
}
