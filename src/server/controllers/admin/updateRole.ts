import type { RequestHandler } from 'express'
import { User, Role, type UserWithRole } from '../../models'
import type { ApiError } from '../../../types/api/errors'

// ---------------------------
// Types
// ---------------------------
type Params = {
  userID: string
}

type Body = {
  roleID?: string | number
}

type UpdateRoleResponse =
  | {
      userID: number
      nickname: string
      email: string
      roleID: number
      roleLabel: string
      isVerified: boolean
    }
  | ApiError

// ---------------------------
// Helpers
// ---------------------------
function firstParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return undefined
}

function toInt(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) ? n : undefined
}

function roleIdToString(roleID: Body['roleID']): string | undefined {
  if (typeof roleID === 'number') return String(roleID)
  return firstParam(roleID)
}

// ---------------------------
// Contrôleur updateRole
// ---------------------------
const controllerAdminUpdateRole: RequestHandler<Params, UpdateRoleResponse, Body> = async (
  req,
  res
): Promise<void> => {
  try {
    const userIdRaw = firstParam(req.params.userID)
    const roleIdRaw = roleIdToString(req.body.roleID)

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

    const updatedUser = await User.findByPk(userID, {
      include: { model: Role, required: true },
    })

    if (!updatedUser) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' })
      return
    }

    const typedUpdatedUser = updatedUser as UserWithRole

    res.json({
      userID: typedUpdatedUser.userID,
      nickname: typedUpdatedUser.nickname,
      email: typedUpdatedUser.email,
      roleID: typedUpdatedUser.roleID,
      roleLabel: typedUpdatedUser.role?.roleLabel ?? 'guest',
      isVerified: typedUpdatedUser.isVerified,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    res.status(500).json({ code: 'ERROR', message })
  }
}

export default controllerAdminUpdateRole