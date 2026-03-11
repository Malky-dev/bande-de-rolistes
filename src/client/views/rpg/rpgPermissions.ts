import type { SessionInfo } from '../../../types/api/session'
import type { RpgTableDetails } from '../../../types/api/rpg'

export function canCreateRpgTable(session: SessionInfo | null): boolean {
  return !!session && (session.roleID === 1 || session.roleID === 2 || session.roleID === 3)
}

export function canEditRpgTable(session: SessionInfo | null, table: RpgTableDetails | null): boolean {
  if (!session || !table) return false
  const isAdminOrOrga = session.roleID === 1 || session.roleID === 2
  const isOwnerDM = session.userID === table.dungeonMaster.userID
  return isAdminOrOrga || isOwnerDM
}