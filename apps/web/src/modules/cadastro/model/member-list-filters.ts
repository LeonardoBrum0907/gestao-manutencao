import { isMemberPosition, type MemberPosition } from "@manutencao/shared";

/**
 * Position filter of the members list, read from the URL (?position=technician). An unknown value, such as a
 * hand-typed or outdated link, means "all" instead of an empty list.
 * @example memberPositionFilter("supervisor") // "supervisor"
 * @example memberPositionFilter("tecnico") // ""
 */
export function memberPositionFilter(param: string | null): MemberPosition | "" {
  return param && isMemberPosition(param) ? param : "";
}
