// ---------------------------
// account.ts - Gestion compte utilisateur
// ---------------------------

import { Router } from 'express'

import controllerGetAccount from '../controllers/account/getAccount'
import controllerUpdateAccount from '../controllers/account/updateAccount'
import requireUser from '../middleware/authUser'
import { verifyCsrf } from '../middleware/csrf'
import { requestLimiter } from '../middleware/rateLimit'

const router = Router()

router.get('/account', requestLimiter, requireUser, controllerGetAccount)

router.put('/account', requestLimiter, verifyCsrf(), requireUser, controllerUpdateAccount)

export default router