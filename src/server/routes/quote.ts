import { Router } from "express";
import { Sequelize } from 'sequelize'
import { Quote, sequelize } from '../models'

const router = Router()

router.get('/quote', async (_req, res) => {
  try {
    const dialect = sequelize.getDialect()
    const randomFn = dialect === 'mysql' || dialect === 'mariadb' ? 'RAND()' : 'RANDOM()'

    const quote = await Quote.findOne({
      order: Sequelize.literal(randomFn),
      attributes: ['content', 'author'],
    })

    if (!quote) {
      res.json({ content: "L'aventure commence quand il manque une règle.", author: 'Anonyme' })
      return
    }

    res.json(quote)
  } catch (err) {
    console.error(err)
    res.status(500).json({ code: 'ERROR', message: 'Erreur lors de la récupération de la citation' })
  }
})

export default router