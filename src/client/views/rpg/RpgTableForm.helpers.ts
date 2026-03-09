import { RPG_TABLE_STATUSES } from "../../../shared/constants";
import type { RpgTableStatus } from "../../../shared/constants";
import type { RpgTableFormValues } from "./rpgTableFormModel";

export async function loadAvailableRpgStatuses(
  fetchStatuses: () => Promise<RpgTableStatus[]>,
  fallbackStatuses: readonly RpgTableStatus[] = RPG_TABLE_STATUSES,
): Promise<RpgTableStatus[]> {
  try {
    return await fetchStatuses();
  } catch {
    return [...fallbackStatuses];
  }
}

export function resolveNextRpgTableStatus(
  nextStatus: RpgTableFormValues["status"],
  currentStatus: RpgTableStatus,
): RpgTableStatus {
  return nextStatus ?? currentStatus;
}
