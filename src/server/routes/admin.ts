// ---------------------------
// admin.ts - Routes Administration
// ---------------------------

import { Router } from 'express'

import adminUsersController from '../controllers/admin/users'
import adminRolesController from '../controllers/admin/roles'
import adminUpdateRoleController from '../controllers/admin/updateRole'

import requireAdmin from '../middleware/authAdmin'
import { verifyCsrf } from '../middleware/csrf'
import { requestLimiter } from '../middleware/rateLimit'

const router = Router()

type UpdateRoleParams = {
  userID: string
}

// ---------------------------
// Routes Admin
// ---------------------------

router.get('/admin/users', requestLimiter, requireAdmin, adminUsersController)

router.get('/admin/roles', requestLimiter, requireAdmin, adminRolesController)

router.put<UpdateRoleParams>(
  '/admin/users/:userID/role',
  requestLimiter,
  verifyCsrf,
  requireAdmin,
  adminUpdateRoleController
)

export default router