// ---------------------------
// rpg.ts - Routes Tables JDR
// ---------------------------

import { Router } from 'express'

import requireUser from '../middleware/authUser'
import { verifyCsrf } from '../middleware/csrf'
import { requestLimiter } from '../middleware/rateLimit'

import controllerListTables from '../controllers/rpg/listTables'
import controllerGetTable from '../controllers/rpg/getTable'
import controllerCreateTable from '../controllers/rpg/createTable'
import controllerUpdateTable from '../controllers/rpg/updateTable'
import controllerUpdateStatus from '../controllers/rpg/updateStatus'
import controllerSignup from '../controllers/rpg/signup'
import controllerUnsignup from '../controllers/rpg/unsignup'

type TableParams = { eventID: string }

const router = Router()

router.get('/rpg/tables', requestLimiter, controllerListTables)
router.get<TableParams>('/rpg/tables/:eventID', requestLimiter, controllerGetTable)

router.post('/rpg/tables', requestLimiter, verifyCsrf(), requireUser, controllerCreateTable)
router.put<TableParams>('/rpg/tables/:eventID', requestLimiter, verifyCsrf(), requireUser, controllerUpdateTable)
router.put<TableParams>('/rpg/tables/:eventID/status', requestLimiter, verifyCsrf(), requireUser, controllerUpdateStatus)

router.post<TableParams>('/rpg/tables/:eventID/signup', requestLimiter, verifyCsrf(), requireUser, controllerSignup)
router.delete<TableParams>('/rpg/tables/:eventID/signup', requestLimiter, verifyCsrf(), requireUser, controllerUnsignup)

export default router