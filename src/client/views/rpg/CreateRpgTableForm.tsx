import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { apiCreateRpgTable } from '../../../api/rpgApi'

type Props = {
  canCreate: boolean
  onCreated: (eventID: number) => void
}

const CreateRpgTableForm = ({ canCreate, onCreated }: Props): ReactElement | null => {
  const [eventDate, setEventDate] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [game, setGame] = useState<string>('')
  const [comments, setComments] = useState<string>('')

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCreate) {
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)

    const trimmedLocation = location.trim()
    const trimmedGame = game.trim()

    if (eventDate.trim().length === 0) {
      setError('La date/heure est requise')
      return
    }

    const parsed = new Date(eventDate)
    if (Number.isNaN(parsed.getTime())) {
      setError('Date/heure invalide')
      return
    }

    if (trimmedLocation.length < 2) {
      setError('Lieu invalide')
      return
    }

    if (trimmedGame.length < 2) {
      setError('Jeu invalide')
      return
    }

    setIsSubmitting(true)

    try {
      const body = {
        eventDate: parsed.toISOString(),
        location: trimmedLocation,
        game: trimmedGame,
        comments: comments.trim().length > 0 ? comments.trim() : null,
      }

      const created = await apiCreateRpgTable(body)
      onCreated(created.eventID)

      setEventDate('')
      setLocation('')
      setGame('')
      setComments('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    void handleSubmit(e)
  }

  return (
    <section className="rpg-create">
      <h3 className="rpg-create__title">Créer une table</h3>

      {error ? <p className="auth-error">{error}</p> : null}

      <form onSubmit={onSubmit} className="rpg-create__form">
        <div className="formRow">
          <label className="label" htmlFor="rpg-eventDate">
            Date/heure
          </label>
          <input
            id="rpg-eventDate"
            className="input"
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="formRow">
          <label className="label" htmlFor="rpg-location">
            Lieu
          </label>
          <input
            id="rpg-location"
            className="input"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="formRow">
          <label className="label" htmlFor="rpg-game">
            Jeu
          </label>
          <input
            id="rpg-game"
            className="input"
            type="text"
            value={game}
            onChange={(e) => setGame(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="formRow">
          <label className="label" htmlFor="rpg-comments">
            Commentaires
          </label>
          <textarea
            id="rpg-comments"
            className="textarea"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="formActions">
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création…' : 'Créer'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateRpgTableForm