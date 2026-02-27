import { Router } from 'express'
import { Op } from 'sequelize'
import { Quote } from '../models'
import requireUser from '../middleware/authUser'
import requireStaff from '../middleware/authStaff'
import { verifyCsrf } from '../middleware/csrf'

const router = Router()

router.get('/quotes', requireUser, requireStaff, async (req, res) => {
    try {
      const page = Math.max(1, Number(req.query.page ?? 1) || 1)
      const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10) || 10))
      const offset = (page - 1) * limit
  
      const qRaw = typeof req.query.q === 'string' ? req.query.q.trim() : ''
      const q = qRaw.slice(0, 80) // limite simple pour eviter les abus
  
      // Echappe % et _ (wildcards LIKE)
      const escaped = q.replace(/[%_\\]/g, (m) => '\\' + m)
  
      const where =
        q.length > 0
          ? {
              [Op.or]: [
                { content: { [Op.like]: `%${escaped}%` } },
                { author: { [Op.like]: `%${escaped}%` } },
              ],
            }
          : undefined
  
      const { rows, count } = await Quote.findAndCountAll({
        where,
        order: [['quoteID', 'DESC']],
        attributes: ['quoteID', 'content', 'author', 'created_at'],
        limit,
        offset,
      })
  
      res.json({
        items: rows,
        page,
        limit,
        totalItems: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        q, // pratique pour debug/affichage
      })
    } catch {
      res.status(500).json({ code: 'ERROR', message: 'Erreur lors du chargement des citations' })
    }
})

router.post('/quotes', requireUser, requireStaff, verifyCsrf(), async (req, res) => {
  try {
    const { content, author } = req.body as { content?: string; author?: string }

    if (typeof content !== 'string' || content.trim().length < 3) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Contenu invalide' })
      return
    }

    const quote = await Quote.create({
      content: content.trim(),
      author: typeof author === 'string' && author.trim() ? author.trim() : 'Anonyme',
    })

    res.status(201).json(quote)
  } catch {
    res.status(500).json({ code: 'ERROR', message: "Erreur lors de l'ajout de la citation" })
  }
})

router.put('/quotes/:quoteID', requireUser, requireStaff, verifyCsrf(), async (req, res) => {
    try {
        const quoteID = Number(req.params.quoteID)
        if (!Number.isFinite(quoteID)) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'ID invalide' })
        return
        }

        const { content, author } = req.body as { content?: string; author?: string }

        if (typeof content !== 'string' || content.trim().length < 3) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'Contenu invalide' })
        return
        }

        const quote = await Quote.findByPk(quoteID)
        if (!quote) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Citation introuvable' })
        return
        }

        quote.content = content.trim()
        quote.author = typeof author === 'string' && author.trim() ? author.trim() : 'Anonyme'
        await quote.save()

        res.json(quote)
    } catch {
        res.status(500).json({ code: 'ERROR', message: 'Erreur lors de la mise à jour' })
    }
})

router.delete('/quotes/:quoteID', requireUser, requireStaff, verifyCsrf(), async (req, res) => {
    try {
        const quoteID = Number(req.params.quoteID)
        if (!Number.isFinite(quoteID)) {
        res.status(400).json({ code: 'BAD_REQUEST', message: 'ID invalide' })
        return
        }

        const deleted = await Quote.destroy({ where: { quoteID } })
        if (!deleted) {
        res.status(404).json({ code: 'NOT_FOUND', message: 'Citation introuvable' })
        return
        }

        res.status(204).send()
    } catch {
        res.status(500).json({ code: 'ERROR', message: 'Erreur lors de la suppression' })
    }
})

export default router