import { useEffect, useMemo, useState } from 'react'
import type { SessionInfo } from '../../../types/api/session'
import { apiGetRpgTable, type RpgTableDetails } from '../../../api/rpgApi'
import EditRpgTableForm from './EditRpgTableForm'

type Props = {
  session: SessionInfo | null
  eventID: number
  onBack: () => void
}

export default function EditRpgTableView({ session, eventID, onBack }: Props) {
  const [loading, setLoading] = useState(true)
  const [table, setTable] = useState<RpgTableDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const safeSet = (fn: () => void) => {
      if (!cancelled) fn()
    }

    const load = async () => {
      safeSet(() => {
        setLoading(true)
        setError(null)
        setSuccess(null)
      })

      try {
        const d = await apiGetRpgTable(eventID)
        safeSet(() => setTable(d))
      } catch (e: unknown) {
        safeSet(() => setError(e instanceof Error ? e.message : 'Impossible de charger la table'))
      } finally {
        safeSet(() => setLoading(false))
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [eventID])

  const canEdit = useMemo(() => {
    if (!session || !table) return false
    const isAdminOrOrga = session.roleID === 1 || session.roleID === 2
    const isOwnerDM = session.userID === table.dungeonMaster.userID
    return isAdminOrOrga || isOwnerDM
  }, [session, table])

  if (loading) {
    return (
      <section className="panel panel--center">
        <h2 className="panel__title">Modifier une table JDR</h2>
        <p className="panel__subtitle">Chargement…</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 className="panel__title" style={{ margin: 0 }}>
          Modifier une table JDR
        </h2>
      </div>

      {error ? <p className="auth-error">{error}</p> : null}
      {success ? <p className="auth-success">{success}</p> : null}

      {!session && (
        <p className="auth-error">Tu dois être connecté pour modifier une table.</p>
      )}

      {session && table && !canEdit && (
        <p className="auth-error">Tu n’as pas les droits pour modifier cette table.</p>
      )}

      {table && (
        <EditRpgTableForm
          table={table}
          canEdit={canEdit}
          onBack={onBack}
          onSaved={() => {
            setSuccess('Table mise à jour.')
            onBack()
          }}
        />
      )}
    </section>
  )
}
