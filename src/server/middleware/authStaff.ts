import type { RequestHandler } from 'express'

const requireStaff: RequestHandler = (req, res, next) => {
  const role = req.user?.Role?.roleLabel
  if (role !== 'admin' && role !== 'organisator') {
    res.status(403).json({ code: 'FORBIDDEN', message: 'Accès réservé admin/organisateur' })
    return
  }
  next()
}

export default requireStaff