import type { SessionInfo } from "@/types/api/session";

function hasRole(
  session: SessionInfo | null,
  allowedRoleIDs: readonly number[],
): boolean {
  return session !== null && allowedRoleIDs.includes(session.roleID);
}

export function canManagePolls(session: SessionInfo | null): boolean {
  return hasRole(session, [1, 2]);
}

export function canCreatePoll(session: SessionInfo | null): boolean {
  return canManagePolls(session);
}

export function canCreateRpgTable(session: SessionInfo | null): boolean {
  return hasRole(session, [1, 2, 3]);
}

export function canManageRpgTable(session: SessionInfo | null): boolean {
  return hasRole(session, [1, 2]);
}

export function canEditRpgTable(
  session: SessionInfo | null,
  dungeonMasterUserID: number | null | undefined,
): boolean {
  if (canManageRpgTable(session)) {
    return true;
  }

  if (session === null || dungeonMasterUserID == null) {
    return false;
  }

  return session.userID === dungeonMasterUserID;
}
