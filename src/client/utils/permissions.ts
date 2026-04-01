import type { SessionInfo } from "@/types/api/session";

const ADMIN_ROLE_ID = 1;
const ADMIN_OR_ORGANISATOR_ROLE_IDS = [1, 2] as const;
const RPG_CREATOR_ROLE_IDS = [1, 2, 3] as const;

function hasRole(
  session: SessionInfo | null,
  allowedRoleIDs: readonly number[],
): boolean {
  return session !== null && allowedRoleIDs.includes(session.roleID);
}

export function canAccessAdmin(session: SessionInfo | null): boolean {
  return hasRole(session, [ADMIN_ROLE_ID]);
}

export function canManageQuotes(session: SessionInfo | null): boolean {
  return hasRole(session, ADMIN_OR_ORGANISATOR_ROLE_IDS);
}

export function canManagePolls(session: SessionInfo | null): boolean {
  return hasRole(session, ADMIN_OR_ORGANISATOR_ROLE_IDS);
}

export function canCreatePoll(session: SessionInfo | null): boolean {
  return canManagePolls(session);
}

export function canCreateRpgTable(session: SessionInfo | null): boolean {
  return hasRole(session, RPG_CREATOR_ROLE_IDS);
}

function canManageRpgTable(session: SessionInfo | null): boolean {
  return hasRole(session, ADMIN_OR_ORGANISATOR_ROLE_IDS);
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
