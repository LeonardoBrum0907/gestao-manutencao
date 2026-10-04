import {
  MACHINE_STATUSES,
  MACHINE_STATUS_LABELS,
  MEMBER_SHIFT_LABELS,
  MEMBER_SHIFTS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUSES,
  type MachineOperationalStatus,
  type MemberShift,
  type MemberStatus,
} from "@manutencao/shared";

export function machineStatusLabel(status: MachineOperationalStatus): string {
  return MACHINE_STATUS_LABELS[status];
}

export function machineStatusClass(status: MachineOperationalStatus): string {
  return status === "stopped" ? "font-semibold text-danger" : "";
}

export function shiftLabel(shift: MemberShift): string {
  return MEMBER_SHIFT_LABELS[shift];
}

export function memberStatusLabel(status: MemberStatus): string {
  return MEMBER_STATUS_LABELS[status];
}

export function memberStatusClass(status: MemberStatus): string {
  return status === "active" ? "" : "font-semibold text-danger";
}

export const machineStatusOptions = MACHINE_STATUSES.map((status) => ({
  value: status,
  label: MACHINE_STATUS_LABELS[status],
}));

export const shiftOptions = MEMBER_SHIFTS.map((shift) => ({
  value: shift,
  label: MEMBER_SHIFT_LABELS[shift],
}));

export const memberStatusOptions = MEMBER_STATUSES.map((status) => ({
  value: status,
  label: MEMBER_STATUS_LABELS[status],
}));
