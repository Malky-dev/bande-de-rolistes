import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import type { SessionInfo } from '../../../types/api/session'
import type { RpgTableDetails } from '../../../types/api/rpg'

import { apiGetRpgTable } from '../../../api/rpgApi'
import RpgTableForm from './RpgTableForm'
import { canCreateRpgTable, canEditRpgTable } from './rpgPermissions'

type Props = {
  session: SessionInfo | null
  /**
   * Si défini => édition
   * Si undefined / null => création
   */
  eventID?: number | null
  onBack: () => void
}

export default function UpsertRpgTableView({ session, eventID, onBack }: Props): ReactElement {
  const isEdit = typeof eventID === 'number'

  const [table, setTable] = useState<RpgTableDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(isEdit)

  useEffect(() => {
    if (!isEdit) {
      setTable(null)
      setError(null)
      setLoading(false)
      return
    }

    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const t = await apiGetRpgTable(eventID)
        if (mounted) setTable(t)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Impossible de charger la table')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void run()
    return () => {
      mounted = false
    }
  }, [isEdit, eventID])

  const canSubmit = useMemo(() => {
    if (isEdit) return canEditRpgTable(session, table)
    return canCreateRpgTable(session)
  }, [isEdit, session, table])

  if (isEdit) {
    if (loading) return <p>Chargement…</p>
    if (error) return <p className="auth-error">{error}</p>
    if (!table) return <p className="auth-error">Table introuvable.</p>

    return (
      <RpgTableForm
        mode="edit"
        table={table}
        canSubmit={canSubmit}
        onBack={onBack}
        onDone={onBack}
      />
    )
  }

  return (
    <RpgTableForm
      mode="create"
      canSubmit={canSubmit}
      onBack={onBack}
      onDone={() => onBack()}
    />
  )
}