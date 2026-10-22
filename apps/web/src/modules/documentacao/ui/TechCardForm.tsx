import { TECH_CARD_DETAIL_FIELDS, TECH_CARD_TYPES, TECH_CARD_TYPE_LABELS, type TechCardType } from "@manutencao/shared";
import { Field, SelectInput, TextArea, TextInput } from "../../../design/ui/controls";
import { useLines, useMachines, useSubassemblies } from "../../cadastro/data/cadastro";
import { useMatrixCatalog } from "../../competencia/data/catalog";
import { useTechDocuments } from "../data/tech-docs";
import { SCOPE_KINDS, SCOPE_KIND_LABELS, withMachineLine, withScopeKind, type ScopeKind, type TechCardFormValues } from "../model/tech-card";

type Props = {
  values: TechCardFormValues;
  onChange: (values: TechCardFormValues) => void;
};

type Setter = <K extends keyof TechCardFormValues>(key: K, value: TechCardFormValues[K]) => void;

// Modelo que a ficha alcança: o próprio, ou o da máquina. Linha não tem modelo.
function useModelOf(values: TechCardFormValues): string {
  const machines = useMachines();
  if (values.scopeKind === "equipment") return values.targetId;
  if (values.scopeKind === "machine") return machines.data?.find((machine) => machine.id === values.targetId)?.equipmentId ?? "";
  return "";
}

function ScopeFields({ values, set, onChange }: { values: TechCardFormValues; set: Setter; onChange: Props["onChange"] }) {
  const lines = useLines();
  const machines = useMachines();
  const catalog = useMatrixCatalog();
  const lineMachines = (machines.data ?? []).filter((machine) => machine.lineId === values.lineId);
  const equipments = (catalog.data?.equipments ?? []).filter((equipment) => !equipment.archived || equipment.id === values.targetId);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Vale para">
        <SelectInput value={values.scopeKind} onChange={(event) => onChange(withScopeKind(values, event.target.value as ScopeKind))}>
          {SCOPE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {SCOPE_KIND_LABELS[kind]}
            </option>
          ))}
        </SelectInput>
      </Field>
      {values.scopeKind === "equipment" ? (
        <Field label="Modelo de equipamento">
          <SelectInput value={values.targetId} onChange={(event) => set("targetId", event.target.value)}>
            <option value="">Escolha o modelo</option>
            {equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : (
        <Field label="Linha">
          <SelectInput
            value={values.scopeKind === "line" ? values.targetId : values.lineId}
            onChange={(event) => {
              if (values.scopeKind === "line") set("targetId", event.target.value);
              else onChange(withMachineLine(values, event.target.value));
            }}
          >
            <option value="">Escolha a linha</option>
            {lines.data?.map((line) => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      {values.scopeKind === "machine" ? (
        <Field label="Máquina">
          <SelectInput value={values.targetId} disabled={!values.lineId} onChange={(event) => set("targetId", event.target.value)}>
            <option value="">{values.lineId && !lineMachines.length ? "Nenhuma máquina nesta linha" : "Escolha a máquina"}</option>
            {lineMachines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
                {machine.tag ? ` · ${machine.tag}` : ""}
              </option>
            ))}
          </SelectInput>
        </Field>
      ) : null}
    </div>
  );
}

function SubassemblyField({ values, set, equipmentId }: { values: TechCardFormValues; set: Setter; equipmentId: string }) {
  const subassemblies = useSubassemblies();
  const choices = (subassemblies.data ?? []).filter((item) => item.equipmentId === equipmentId && (!item.archived || item.id === values.subassemblyId));
  if (!equipmentId) return null;
  return (
    <Field label="Subconjunto">
      <SelectInput value={values.subassemblyId} onChange={(event) => set("subassemblyId", event.target.value)}>
        <option value="">Nenhum / a máquina toda</option>
        {choices.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}

// Campos próprios do tipo escolhido, na ordem da ficha.
function DetailFields({ values, set }: { values: TechCardFormValues; set: Setter }) {
  const fields = TECH_CARD_DETAIL_FIELDS[values.type];
  const setDetail = (key: string, text: string) => set("details", { ...values.details, [key]: text });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.key} className={field.long ? "sm:col-span-2" : ""}>
          <Field label={field.label}>
            {field.long ? (
              <TextArea value={values.details[field.key] ?? ""} className="min-h-20" onChange={(event) => setDetail(field.key, event.target.value)} />
            ) : (
              <TextInput value={values.details[field.key] ?? ""} onChange={(event) => setDetail(field.key, event.target.value)} />
            )}
          </Field>
        </div>
      ))}
    </div>
  );
}

function SourceFields({ values, set, equipmentId }: { values: TechCardFormValues; set: Setter; equipmentId: string }) {
  const documents = useTechDocuments(equipmentId || undefined);
  const choices = (documents.data ?? []).filter((document) => !equipmentId || document.equipmentId === equipmentId);
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Field label="Documento de origem">
        <SelectInput value={values.documentId} onChange={(event) => set("documentId", event.target.value)}>
          <option value="">{choices.length ? "Sem documento" : "Nenhum documento cadastrado no modelo"}</option>
          {choices.map((document) => (
            <option key={document.id} value={document.id}>
              {document.name}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Página">
        <TextInput inputMode="numeric" value={values.page} disabled={!values.documentId} placeholder="Ex.: 694" onChange={(event) => set("page", event.target.value)} />
      </Field>
      <Field label="Folha / coluna">
        <TextInput value={values.sheet} placeholder="Ex.: 166" onChange={(event) => set("sheet", event.target.value)} />
      </Field>
    </div>
  );
}

const codeLabel: Record<TechCardType, string> = {
  error_code: "Código do erro ou alarme",
  interface: "Código (opcional)",
  signal: "Tag ou endereço do sinal",
  part: "Nº da peça",
  parameter: "Nome do parâmetro",
  procedure: "Código (opcional)",
};

/**
 * Campos da ficha de documentação, para criar e editar; quem chama guarda os valores e grava.
 * @example <TechCardForm values={values} onChange={setValues} />
 */
export function TechCardForm({ values, onChange }: Props) {
  const equipmentId = useModelOf(values);
  const set: Setter = (key, value) => onChange({ ...values, [key]: value });

  return (
    <div className="flex flex-col gap-5">
      <Field label="Tipo da ficha">
        <SelectInput value={values.type} onChange={(event) => onChange({ ...values, type: event.target.value as TechCardType, details: {} })}>
          {TECH_CARD_TYPES.map((type) => (
            <option key={type} value={type}>
              {TECH_CARD_TYPE_LABELS[type].one}
            </option>
          ))}
        </SelectInput>
      </Field>
      <ScopeFields values={values} set={set} onChange={onChange} />
      <SubassemblyField values={values} set={set} equipmentId={equipmentId} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Field label={codeLabel[values.type]}>
          <TextInput value={values.code} onChange={(event) => set("code", event.target.value)} />
        </Field>
        <Field label="Título">
          <TextInput value={values.title} required onChange={(event) => set("title", event.target.value)} />
        </Field>
      </div>
      <Field label="Resumo (a resposta em uma ou duas frases)">
        <TextArea value={values.summary} className="min-h-20" onChange={(event) => set("summary", event.target.value)} />
      </Field>
      <DetailFields values={values} set={set} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tag do dispositivo">
          <TextInput value={values.deviceTag} placeholder="Ex.: -X100" onChange={(event) => set("deviceTag", event.target.value)} />
        </Field>
        <Field label="Termo original (DE/EN)">
          <TextInput value={values.originalTerm} placeholder="Ex.: Folgemaschine" onChange={(event) => set("originalTerm", event.target.value)} />
        </Field>
        <Field label="Etiquetas (vírgula)">
          <TextInput value={values.tags} placeholder="Ex.: Rede, Elétrica" onChange={(event) => set("tags", event.target.value)} />
        </Field>
      </div>
      <SourceFields values={values} set={set} equipmentId={equipmentId} />
      <label className="flex items-center gap-2 text-sm text-app">
        <input type="checkbox" checked={values.reviewNeeded} onChange={(event) => set("reviewNeeded", event.target.checked)} />
        Precisa de revisão (criada com dúvida; conferir no manual antes de confiar)
      </label>
    </div>
  );
}
