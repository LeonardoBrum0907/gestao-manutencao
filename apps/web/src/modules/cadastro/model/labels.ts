import {
  MACHINE_STATUSES,
  MACHINE_STATUS_LABELS,
  TECHNICIAN_SHIFT_LABELS,
  TECHNICIAN_SHIFTS,
  TECHNICIAN_STATUS_LABELS,
  TECHNICIAN_STATUSES,
  type MachineOperationalStatus,
  type TechnicianShift,
  type TechnicianStatus,
} from "@manutencao/shared";

export function machineStatusLabel(status: MachineOperationalStatus): string {
  return MACHINE_STATUS_LABELS[status];
}

export function shiftLabel(shift: TechnicianShift): string {
  return TECHNICIAN_SHIFT_LABELS[shift];
}

export function technicianStatusLabel(status: TechnicianStatus): string {
  return TECHNICIAN_STATUS_LABELS[status];
}

export const machineStatusOptions = MACHINE_STATUSES.map((status) => ({
  value: status,
  label: MACHINE_STATUS_LABELS[status],
}));

export const shiftOptions = TECHNICIAN_SHIFTS.map((shift) => ({
  value: shift,
  label: TECHNICIAN_SHIFT_LABELS[shift],
}));

export const technicianStatusOptions = TECHNICIAN_STATUSES.map((status) => ({
  value: status,
  label: TECHNICIAN_STATUS_LABELS[status],
}));
