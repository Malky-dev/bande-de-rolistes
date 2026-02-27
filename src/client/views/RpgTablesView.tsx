import { useEffect, useMemo, useState } from 'react'
import type { SessionInfo } from '../../types/api/session'
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
  onCreateTable: () => void
  onEditTable: (eventID: number) => void
  onLogin: () => void
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
  if (status === 'OPEN') return 'Inscription Ouverte'
  if (status === 'CLOSED') return 'Inscription Fermée'
  return 'Table Annulée'
}

function statusClass(status: RpgTableListItem['status']): string {
  if (status === 'OPEN') return 'rpg-status rpg-status--open'
  if (status === 'CLOSED') return 'rpg-status rpg-status--closed'
  return 'rpg-status rpg-status--cancelled'
}

function RpgTablesView({ session, onCreateTable, onEditTable, onLogin }: Props) {
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
    if (!session) return false
    return session.roleID === 1 || session.roleID === 2 || session.roleID === 3
  }, [session])

  const canEditTable = (t: RpgTableListItem): boolean => {
    if (!session) return false
    const isAdminOrOrga = session.roleID === 1 || session.roleID === 2
    // Le propriétaire de la table est le MJ (dungeonMaster)
    const isOwnerDM = session.userID === t.dungeonMaster.userID
    return isAdminOrOrga || isOwnerDM
  }

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
      if (!cancelled) fn()
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
        safeSet(() => setLoading(false))
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
      if (!cancelled) fn()
    }

    const loadDetails = async (): Promise<void> => {
      safeSet(() => {
        setError(null)
        setSuccess(null)
        setDetailsLoading(true)
      })

      try {
        const d = await apiGetRpgTable(eventID)
        safeSet(() => setDetails(d))
      } catch (e: unknown) {
        safeSet(() => {
          setDetails(null)
          setError(e instanceof Error ? e.message : 'Impossible de charger la table')
        })
      } finally {
        safeSet(() => setDetailsLoading(false))
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [selectedID])

  const mySignupBucket: MySignupBucket = useMemo(() => {
    if (!details || !session) return null

    const inConfirmed = details.confirmed.some((p) => p.userID === session.userID)
    if (inConfirmed) return 'CONFIRMED'

    const inWaitlist = details.waitlist.some((p) => p.userID === session.userID)
    if (inWaitlist) return 'WAITLIST'

    return null
  }, [details, session])

  const handleSignup = async (): Promise<void> => {
    if (!details) return

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
    if (!details) return

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
      <div className="panel__header">
      <h2 className="panel__title">Tables JDR</h2>

      {canCreate && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn-primary" type="button" onClick={onCreateTable}>
            Créer une table
          </button>
        </div>
      )}
    </div>

      <p className="panel__subtitle">
        Inscris-toi sur une table. Les modalités sont définies par le MJ.
      </p>

      <p className="panel__subtitle">
        En l'absence de règles specifiques, c'est premier arrivé, premier servi.
      </p>

      {error && <p className="auth-error">{error}</p>}
      {success && <p className="auth-success">{success}</p>}

      <div className="rpg-grid">
        <aside className="rpg-list">
          {tables.length === 0 && <div className="rpg-empty">Aucune table à venir.</div>}

          {tables.map((t) => (
            <div
              key={t.eventID}
              role="button"
              tabIndex={0}
              className={`rpg-list-item rpg-list-item--card ${selectedID === t.eventID ? 'rpg-list-item--active' : ''}`}
              onClick={() => setSelectedID(t.eventID)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedID(t.eventID)
                }
              }}
            >
              <div className="rpg-list-item__top">
                <span className="rpg-list-item__title">{t.game.toUpperCase()}</span>
              </div>

              <div className="rpg-list-item__meta">
                <span>{formatDate(t.eventDate)}</span>
              </div>

              <div className="rpg-list-item__meta">
                <span>Lieu : {t.location}</span>
              </div>

              <div className="rpg-list-item__meta rpg-list-item__meta--with-action">
                <span>MJ : {t.dungeonMaster.nickname}</span>
                <span>•</span>
                <span>{t.maxPlayers} places</span>
              </div>

              <div className="rpg-list-item__actions">
                <span className={statusClass(t.status)}>{statusLabel(t.status)}</span>

                {canEditTable(t) && (
                  <button
                    type="button"
                    className="btn-secondary btn-secondary--xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditTable(t.eventID)
                    }}
                  >
                    Modifier
                  </button>
                )}
              </div>
            </div>
          ))}
        </aside>

        <div className="rpg-detail">
          {!details && !detailsLoading && <div className="rpg-empty">Sélectionne une table.</div>}
          {detailsLoading && <div className="rpg-empty">Chargement de la table…</div>}

          {details && !detailsLoading && (
            <>
              <div className="rpg-detail__header">
                <div>
                  <h3 className="rpg-detail__title">{details.game.toUpperCase()}</h3>

                  <div className="rpg-detail__meta">
                    <span>{formatDate(details.eventDate)}</span>
                    <span>•</span>
                    <span>{details.location}</span>
                    <span>•</span>
                    <span>MJ : {details.dungeonMaster.nickname}</span>
                  </div>
                </div>

                <div className="rpg-detail__actions">
                  {statusClass(details.status) !== 'rpg-status rpg-status--open' && <span className={statusClass(details.status)}>{statusLabel(details.status)}</span>}

                  {!canAct && details.status === 'OPEN'  && (
                    <div className="rpg-buttons">
                      <button className="btn-primary" type="button" onClick={onLogin}>
                        Se connecter
                      </button>

                      <button
                        className="btn-discord"
                        type="button"
                        onClick={() => window.location.href = '/api/discord/init'}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Se connecter avec Discord
                      </button>
                    </div>
                  )}

                  {canAct && details.status === 'OPEN' && (
                    <div className="rpg-buttons">
                      {mySignupBucket === null && (
                        <button className="btn-primary" onClick={() => void handleSignup()} disabled={actionLoading}>
                          S&apos;inscrire
                        </button>
                      )}

                      {mySignupBucket !== null && (
                        <button className="btn-secondary" onClick={() => void handleUnsignup()} disabled={actionLoading}>
                          Se désinscrire
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="rpg-detail__content">
                <div className="rpg-block">
                  <h4>Description</h4>
                  <p>{details.comments || '—'}</p>
                </div>

                <div className="rpg-block">
                  <h4>Joueurs confirmés ({details.confirmed.length}/{details.confirmedCap})</h4>
                  {details.confirmed.length === 0 ? (
                    <p>—</p>
                  ) : (
                    <ul>
                      {details.confirmed.map((p) => (
                        <li key={p.userID}>{p.nickname}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rpg-block">
                  <h4>Liste d&apos;attente ({details.waitlist.length})</h4>
                  {details.waitlist.length === 0 ? (
                    <p>—</p>
                  ) : (
                    <ul>
                      {details.waitlist.map((p) => (
                        <li key={p.userID}>{p.nickname}</li>
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