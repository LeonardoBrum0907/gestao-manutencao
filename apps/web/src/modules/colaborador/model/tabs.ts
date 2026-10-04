import type { MemberPosition } from "@manutencao/shared";

export const MEMBER_TABS = [
  { key: "perfil", label: "Perfil", positions: ["technician", "supervisor"] },
  { key: "competencias", label: "Competências", positions: ["technician"] },
] as const satisfies readonly { key: string; label: string; positions: readonly MemberPosition[] }[];

export type MemberTab = (typeof MEMBER_TABS)[number]["key"];

export function tabsFor(position: MemberPosition) {
  return MEMBER_TABS.filter((tab) => (tab.positions as readonly MemberPosition[]).includes(position));
}

// Aba desconhecida, ou que não vale para o cargo, cai no Perfil.
export function resolveTab(value: string | undefined, position: MemberPosition): MemberTab {
  return tabsFor(position).find((tab) => tab.key === value)?.key ?? "perfil";
}
