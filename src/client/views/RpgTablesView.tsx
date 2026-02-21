import { useEffect, useMemo, useState } from 'react'
import type { SessionInfo } from '../../types/api/session'
import CreateRpgTableForm from './rpg/CreateRpgTableForm'
import {
  apiGetRpgTable,
  apiListRpgTables,
  apiSignupRpg,
  apiUnsignupRpg,
  type RpgTableDetails,
  type RpgTableListItem,
} from '../../api/rpgApi'

type Props = {
  session: SessionInfo | null
}

type MySignupBucket = 'CONFIRMED' | 'WAITLIST' | null

function formatDate(iso: string): string {
  const d = new Date(iso)

  if (Number.isNaN(d.getTime())) {
    return iso
  }

  return d.toLocaleString('fr-FR', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusLabel(status: RpgTableListItem['status']): string {
  if (status === 'OPEN') {
    return 'Ouvert'
  }

  if (status === 'CLOSED') {
    return 'Fermé'
  }

  return 'Annulé'
}

function statusClass(status: RpgTableListItem['status']): string {
  if (status === 'OPEN') {
    return 'rpg-status rpg-status--open'
  }

  if (status === 'CLOSED') {
    return 'rpg-status rpg-status--closed'
  }

  return 'rpg-status rpg-status--cancelled'
}

function RpgTablesView({ session }: Props) {
  const [loading, setLoading] = useState(true)
  const [tables, setTables] = useState<RpgTableListItem[]>([])
  const [selectedID, setSelectedID] = useState<number | null>(null)

  const [detailsLoading, setDetailsLoading] = useState(false)
  const [details, setDetails] = useState<RpgTableDetails | null>(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canAct = useMemo(() => session !== null, [session])

  const canCreate = useMemo(() => {
    if (!session) {
      return false
    }
  
    return session.roleID === 1 || session.roleID === 2 || session.roleID === 3
  }, [session])

  const refreshList = async (): Promise<void> => {
    const list = await apiListRpgTables()

    setTables(list)

    if (selectedID === null && list.length > 0) {
      setSelectedID(list[0].eventID)
    }
  }

  const refreshDetails = async (eventID: number): Promise<void> => {
    setDetailsLoading(true)

    try {
      const d = await apiGetRpgTable(eventID)
      setDetails(d)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const safeSet = (fn: () => void): void => {
      if (!cancelled) {
        fn()
      }
    }

    const load = async (): Promise<void> => {
      try {
        const list = await apiListRpgTables()

        safeSet(() => {
          setTables(list)
          setSelectedID(list.length > 0 ? list[0].eventID : null)
        })
      } catch (e: unknown) {
        safeSet(() => {
          setError(e instanceof Error ? e.message : 'Impossible de charger les tables')
        })
      } finally {
        safeSet(() => {
          setLoading(false)
        })
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (selectedID === null) {
      setDetails(null)
      return
    }

    const eventID = selectedID

    let cancelled = false

    const safeSet = (fn: () => void): void => {
      if (!cancelled) {
        fn()
      }
    }

    const loadDetails = async (): Promise<void> => {
      safeSet(() => {
        setError(null)
        setSuccess(null)
        setDetailsLoading(true)
      })

      try {
        const d = await apiGetRpgTable(eventID)

        safeSet(() => {
          setDetails(d)
        })
      } catch (e: unknown) {
        safeSet(() => {
          setDetails(null)
          setError(e instanceof Error ? e.message : 'Impossible de charger la table')
        })
      } finally {
        safeSet(() => {
          setDetailsLoading(false)
        })
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [selectedID])

  const mySignupBucket: MySignupBucket = useMemo(() => {
    if (!details || !session) {
      return null
    }

    const inConfirmed = details.confirmed.some((p) => p.userID === session.userID)
    if (inConfirmed) {
      return 'CONFIRMED'
    }

    const inWaitlist = details.waitlist.some((p) => p.userID === session.userID)
    if (inWaitlist) {
      return 'WAITLIST'
    }

    return null
  }, [details, session])

  const handleSignup = async (): Promise<void> => {
    if (!details) {
      return
    }

    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await apiSignupRpg(details.eventID)
      await refreshDetails(details.eventID)
      await refreshList()
      setSuccess('Inscription enregistrée.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Inscription impossible')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnsignup = async (): Promise<void> => {
    if (!details) {
      return
    }

    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await apiUnsignupRpg(details.eventID)
      await refreshDetails(details.eventID)
      await refreshList()
      setSuccess('Désinscription effectuée.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Désinscription impossible')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="panel panel--center">
        <h2 className="panel__title">Tables JDR</h2>
        <p className="panel__subtitle">Chargement…</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2 className="panel__title">Tables JDR</h2>

      <p className="panel__subtitle">
        Inscris-toi sur une table. Les {details?.confirmedCap ?? 6} premiers sont confirmés, le reste est en liste d&apos;attente.
      </p>

      <CreateRpgTableForm
        canCreate={canCreate}
        onCreated={(eventID: number) => {
          void refreshList().then(() => {
            setSelectedID(eventID)
            void refreshDetails(eventID)
          })
        }}
      />

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}

      <div className="rpg-grid">
        <aside className="rpg-list">
          {tables.length === 0 && <div className="rpg-empty">Aucune table à venir.</div>}

          {tables.map((t) => (
            <button
              key={t.eventID}
              type="button"
              className={`rpg-list-item ${selectedID === t.eventID ? 'rpg-list-item--active' : ''}`}
              onClick={() => setSelectedID(t.eventID)}
            >
              <div className="rpg-list-item__top">
                <span className="rpg-list-item__title">{t.game}</span>
                <span className={statusClass(t.status)}>{statusLabel(t.status)}</span>
              </div>

              <div className="rpg-list-item__meta">
                <span>{formatDate(t.eventDate)}</span>
                <span>•</span>
                <span>{t.location}</span>
              </div>

              <div className="rpg-list-item__meta">
                <span>MJ : {t.dungeonMaster.nickname}</span>
                <span>•</span>
                <span>{t.maxPlayers} places</span>
              </div>
            </button>
          ))}
        </aside>

        <div className="rpg-detail">
          {!details && !detailsLoading && <div className="rpg-empty">Sélectionne une table.</div>}
          {detailsLoading && <div className="rpg-empty">Chargement de la table…</div>}

          {details && !detailsLoading && (
            <>
              <div className="rpg-detail__header">
                <div>
                  <h3 className="rpg-detail__title">{details.game}</h3>

                  <div className="rpg-detail__meta">
                    <span>{formatDate(details.eventDate)}</span>
                    <span>•</span>
                    <span>{details.location}</span>
                    <span>•</span>
                    <span>MJ : {details.dungeonMaster.nickname}</span>
                  </div>
                </div>

                <div className="rpg-detail__actions">
                  <span className={statusClass(details.status)}>{statusLabel(details.status)}</span>

                  {!canAct && <span className="rpg-hint">Connecte-toi pour t&apos;inscrire.</span>}

                  {canAct && details.status === 'OPEN' && (
                    <div className="rpg-buttons">
                      <button
                        className="btn-primary"
                        type="button"
                        disabled={actionLoading || mySignupBucket !== null}
                        onClick={() => void handleSignup()}
                        title={mySignupBucket ? 'Tu es déjà inscrit.' : ''}
                      >
                        S&apos;inscrire
                      </button>

                      <button
                        className="btn-secondary"
                        type="button"
                        disabled={actionLoading || mySignupBucket === null}
                        onClick={() => void handleUnsignup()}
                        title={mySignupBucket ? 'Tu es inscrit, tu peux te retirer.' : 'Pas inscrit.'}
                      >
                        Se désinscrire
                      </button>

                      {mySignupBucket && (
                        <span className="rpg-hint">
                          Statut : {mySignupBucket === 'CONFIRMED' ? 'Confirmé' : 'Liste d’attente'}
                        </span>
                      )}
                    </div>
                  )}

                  {canAct && details.status !== 'OPEN' && (
                    <span className="rpg-hint">Inscriptions indisponibles (table fermée/annulée).</span>
                  )}
                </div>
              </div>

              {details.comments && <p className="rpg-detail__comments">{details.comments}</p>}

              <div className="rpg-rosters">
                <div className="rpg-roster">
                  <h4 className="rpg-roster__title">
                    Confirmés ({details.confirmed.length}/{details.confirmedCap})
                  </h4>

                  {details.confirmed.length === 0 ? (
                    <div className="rpg-empty">Aucun joueur confirmé.</div>
                  ) : (
                    <ul className="rpg-roster__list">
                      {details.confirmed.map((p) => (
                        <li key={`${p.userID}-${p.created_at}`} className="rpg-roster__item">
                          <span>{p.nickname}</span>
                          <span className="rpg-roster__date">{formatDate(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rpg-roster">
                  <h4 className="rpg-roster__title">Liste d&apos;attente ({details.waitlist.length})</h4>

                  {details.waitlist.length === 0 ? (
                    <div className="rpg-empty">Personne en attente.</div>
                  ) : (
                    <ul className="rpg-roster__list">
                      {details.waitlist.map((p) => (
                        <li key={`${p.userID}-${p.created_at}`} className="rpg-roster__item">
                          <span>{p.nickname}</span>
                          <span className="rpg-roster__date">{formatDate(p.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default RpgTablesView