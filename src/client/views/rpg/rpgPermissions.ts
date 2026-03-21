import type { SessionInfo } from "../../../types/api/session";
import type { RpgTableDetails } from "../../../types/api/rpg";
import {
  canCreateRpgTable as canCreateRpgTableFromPermissions,
  canEditRpgTable as canEditRpgTableFromPermissions,
} from "../../utils/permissions";

export function canCreateRpgTable(session: SessionInfo | null): boolean {
  return canCreateRpgTableFromPermissions(session);
}

export function canEditRpgTable(
  session: SessionInfo | null,
  table: RpgTableDetails | null,
): boolean {
  return canEditRpgTableFromPermissions(
    session,
    table?.dungeonMaster.userID ?? null,
  );
}
