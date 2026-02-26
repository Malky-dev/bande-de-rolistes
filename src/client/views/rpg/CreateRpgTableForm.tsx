import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { fr } from 'date-fns/locale'

import { apiCreateRpgTable } from '../../../api/rpgApi'

type Props = {
  canCreate: boolean
  onCreated: (eventID: number) => void
  onBack: () => void
}

const LOCATIONS: string[] = ['EVA de Maurepas', 'Salle Oxford', 'Autre (voir description)']

const CreateRpgTableForm = ({ canCreate, onCreated, onBack }: Props): ReactElement | null => {
  const [eventDate, setEventDate] = useState<Date | null>(null)
  const [location, setLocation] = useState('')
  const [game, setGame] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<number>(6)
  const [comments, setComments] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canCreate) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const trimmedGame = game.trim()

    if (!eventDate) {
      setError('La date/heure est requise')
      return
    }

    if (Number.isNaN(eventDate.getTime())) {
      setError('Date/heure invalide')
      return
    }

    if (location.trim().length < 2) {
      setError('Lieu invalide')
      return
    }

    if (trimmedGame.length < 2) {
      setError('Jeu invalide')
      return
    }

    // Aligné avec le backend : 1..10
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 10) {
      setError('Nombre max de joueurs invalide (1 à 10)')
      return
    }

    setIsSubmitting(true)

    try {
      const body = {
        eventDate: eventDate.toISOString(),
        location: location.trim(),
        game: trimmedGame,
        maxPlayers,
        comments: comments.trim().length > 0 ? comments.trim() : null,
      }

      const created = await apiCreateRpgTable(body)
      onCreated(created.eventID)

      setEventDate(null)
      setLocation('')
      setGame('')
      setMaxPlayers(4)
      setComments('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rpg-create">
      <h3 className="rpg-create__title">Créer une table</h3>

      {error ? <p className="auth-error">{error}</p> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="rpg-create__form">
        {/* DatePicker + MaxPlayers sur la même ligne */}
        <div className="formRow formRow--inline">
          <div className="formField formField--grow">
            <label className="label" htmlFor="rpg-eventDate">
              Date / heure
            </label>

            <DatePicker
              id="rpg-eventDate"
              selected={eventDate}
              onChange={(date: Date | null) => setEventDate(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={fr}
              placeholderText="Choisir une date et une heure"
              className="input"
              disabled={isSubmitting}
            />
          </div>

          <div className="formField formField--small">
            <label className="label" htmlFor="rpg-maxPlayers">
              Joueurs max
            </label>

            <select
              id="rpg-maxPlayers"
              className="input"
              value={String(maxPlayers)}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
              disabled={isSubmitting}
              required
            >
            {[1,2,3,4,5,6,7,8,9,10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          </div>
        </div>

        {/* Lieu en dropdown (2 options) */}
        <div className="formRow">
          <label className="label" htmlFor="rpg-location">
            Lieu
          </label>

          <select
            id="rpg-location"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isSubmitting}
            required
          >
            <option value="">-- Choisir un lieu --</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Jeu */}
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
            required
          />
        </div>

        {/* Commentaires */}
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

        <div className="formActions formActions--dual">
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Retour
          </button>

          <button
            className="btn-primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création…' : 'Créer'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateRpgTableForm