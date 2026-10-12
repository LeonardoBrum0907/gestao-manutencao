import {
  MEMBER_SHIFT_LABELS,
  MEMBER_SHIFTS,
  TEAM_COLUMN_GROUP_LABELS,
  TEAM_COLUMN_GROUPS,
  TEAM_MATRIX_VIEW_LABELS,
  TEAM_MATRIX_VIEWS,
  TEAM_ROW_GROUP_LABELS,
  TEAM_ROW_GROUPS,
  type TeamColumnGroup,
  type TeamMatrixDto,
  type TeamRowGroup,
} from "@manutencao/shared";
import type { ReactNode } from "react";
import { Field, MultiSelect, SelectInput } from "../../../../design/ui/controls";
import type { TeamControls } from "./use-team-controls";

function ViewSwitch({ controls }: { controls: TeamControls }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-app" id="team-view-label">
        Visão
      </span>
      <div role="group" aria-labelledby="team-view-label" className="inline-flex overflow-hidden rounded-control border border-line bg-surface">
        {TEAM_MATRIX_VIEWS.map((view) => {
          const active = controls.layout.view === view;
          return (
            <button
              key={view}
              type="button"
              aria-pressed={active}
              onClick={() => controls.chooseView(view)}
              className={`px-3.5 py-2.5 text-sm transition [&+&]:border-l [&+&]:border-line ${active ? "bg-accent-soft font-semibold text-accent-ink" : "text-app hover:bg-chip"}`}
            >
              {TEAM_MATRIX_VIEW_LABELS[view]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Slot({ width, children }: { width: string; children: ReactNode }) {
  return <div className={`min-w-0 ${width}`}>{children}</div>;
}

// Barra da grade: visão, agrupamentos (salvos no sistema), turno e linhas (filtros da tela) e exportar.
export function TeamToolbar({ team, controls, exportButtons }: { team: TeamMatrixDto; controls: TeamControls; exportButtons: ReactNode }) {
  const { layout } = controls;
  const lineOptions = team.lines.map((line) => ({ value: line.id, label: line.name }));
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <ViewSwitch controls={controls} />
      <Slot width="w-full sm:w-44">
        <Field label="Agrupar técnicos por">
          <SelectInput value={layout.rowGroup} onChange={(event) => controls.saveLayout({ rowGroup: event.target.value as TeamRowGroup })}>
            {TEAM_ROW_GROUPS.map((group) => (
              <option key={group} value={group}>
                {TEAM_ROW_GROUP_LABELS[group]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Slot>
      <Slot width="w-full sm:w-52">
        <Field label="Colunas">
          <SelectInput value={layout.columnGroup} onChange={(event) => controls.saveLayout({ columnGroup: event.target.value as TeamColumnGroup })}>
            {TEAM_COLUMN_GROUPS.map((group) => (
              <option key={group} value={group}>
                {TEAM_COLUMN_GROUP_LABELS[group]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Slot>
      <Slot width="w-full sm:w-40">
        <Field label="Turno">
          <SelectInput value={controls.shift} onChange={(event) => controls.setSearch({ shift: event.target.value })}>
            <option value="">Todos</option>
            {MEMBER_SHIFTS.map((shift) => (
              <option key={shift} value={shift}>
                {MEMBER_SHIFT_LABELS[shift]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Slot>
      {layout.columnGroup === "line" && lineOptions.length > 1 ? (
        <Slot width="w-full sm:w-64">
          <MultiSelect label="Linhas" placeholder="Todas" options={lineOptions} value={[...controls.lineIds]} onChange={(lineIds) => controls.setSearch({ lineIds })} />
        </Slot>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{exportButtons}</div>
    </div>
  );
}
