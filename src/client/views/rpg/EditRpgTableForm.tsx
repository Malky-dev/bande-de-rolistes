import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { fr } from 'date-fns/locale'

import { apiUpdateRpgTable, type RpgTableDetails } from '../../../api/rpgApi'

type Props = {
  table: RpgTableDetails
  canEdit: boolean
  onSaved: () => void
  onBack: () => void
}

const LOCATIONS: string[] = ['EVA de Maurepas', 'Salle Oxford', 'Autre (voir description)']

export default function EditRpgTableForm({ table, canEdit, onSaved, onBack }: Props): ReactElement | null {
  const initialDate = useMemo(() => {
    const d = new Date(table.eventDate)
    return Number.isNaN(d.getTime()) ? null : d
  }, [table.eventDate])

  const [eventDate, setEventDate] = useState<Date | null>(initialDate)
  const [location, setLocation] = useState(table.location)
  const [game, setGame] = useState(table.game)
  const [maxPlayers, setMaxPlayers] = useState<number>(table.maxPlayers)
  const [comments, setComments] = useState(table.comments ?? '')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setEventDate(initialDate)
    setLocation(table.location)
    setGame(table.game)
    setMaxPlayers(table.maxPlayers)
    setComments(table.comments ?? '')
  }, [table, initialDate])

  if (!canEdit) return null

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

    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 10) {
      setError('Nombre max de joueurs invalide (1 à 10)')
      return
    }

    setIsSubmitting(true)

    try {
      await apiUpdateRpgTable(table.eventID, {
        eventDate: eventDate.toISOString(),
        location: location.trim(),
        game: trimmedGame,
        maxPlayers,
        comments: comments.trim().length > 0 ? comments.trim() : null,
      })

      onSaved()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rpg-create">
      <h3 className="rpg-create__title">Modifier la table</h3>

      {error ? <p className="auth-error">{error}</p> : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="rpg-create__form">
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
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

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
          <button type="button" className="btn-secondary" onClick={onBack} disabled={isSubmitting}>
            Retour
          </button>

          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Enregistrer
          </button>
        </div>
      </form>
    </section>
  )
}
