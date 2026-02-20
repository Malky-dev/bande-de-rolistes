import type { Request, Response } from 'express'
import { User, Role, type UserWithRole } from '../../models'

// ---------------------------
// Helpers
// ---------------------------
function firstParam(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

function toInt(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

// ---------------------------
// Contrôleur updateRole
// ---------------------------
export default async function controllerAdminUpdateRole(req: Request, res: Response): Promise<void> {
  try {
    const userIdRaw = firstParam(req.params.userID)
    const roleIdRaw =
      typeof (req.body as { roleID?: unknown }).roleID === 'number'
        ? String((req.body as { roleID?: number }).roleID)
        : firstParam((req.body as { roleID?: unknown }).roleID)

    const userID = toInt(userIdRaw)
    const roleID = toInt(roleIdRaw)

    if (!userID || !roleID) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'userID and roleID are required' })
      return
    }

    const role = await Role.findByPk(roleID)
    if (!role) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Role not found' })
      return
    }

    const user = await User.findByPk(userID)
    if (!user) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' })
      return
    }

    // Empêcher de modifier son propre rôle (sécurité)
    if (req.user?.userID === user.userID) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Cannot modify your own role' })
      return
    }

    await user.update({ roleID })

    const updatedUser = (await User.findByPk(userID, {
      include: { model: Role, required: true },
    })) as UserWithRole | null

    if (!updatedUser) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' })
      return
    }

    res.json({
      userID: updatedUser.userID,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      roleID: updatedUser.roleID,
      roleLabel: updatedUser.role?.roleLabel || 'guest',
      isVerified: updatedUser.isVerified,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ code: 'ERROR', message })
  }
}
