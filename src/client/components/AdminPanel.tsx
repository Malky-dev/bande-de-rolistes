import { useEffect, useState } from 'react'
import { apiAdminRoles, apiAdminUpdateRole, apiAdminUsers } from '../../api/authApi'
import type { AdminRole, AdminUser } from '@/types/api/admin'

function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData(): Promise<void> {
    try {
      setLoading(true)
      setError(null)
      setSuccessMessage(null)

      console.log('🔄 Chargement des données admin...')
      const token = localStorage.getItem('bdr_token')
      console.log('Token présent:', !!token)

      const [usersData, rolesData] = await Promise.all([
        apiAdminUsers(),
        apiAdminRoles(),
      ])

      console.log('✅ Données chargées:', {
        usersCount: usersData.length,
        rolesCount: rolesData.length,
      })

      setUsers(usersData)
      setRoles(rolesData)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du chargement des données'
      console.error('❌ Erreur lors du chargement:', err)
      setError(errorMessage)

      if (
        errorMessage.includes('Token') ||
        errorMessage.includes('UNAUTHORIZED') ||
        errorMessage.includes('FORBIDDEN')
      ) {
        setError(`${errorMessage}. Veuillez vous reconnecter.`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleChange(userID: number, newRoleID: number): Promise<void> {
    try {
      setUpdating(userID)
      setError(null)
      setSuccessMessage(null)

      const updatedUser = await apiAdminUpdateRole(userID, newRoleID)

      setUsers(prevUsers =>
        prevUsers.map(user => (user.userID === userID ? updatedUser : user))
      )

      setSuccessMessage(`Rôle de ${updatedUser.nickname} mis à jour avec succès`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du rôle')
      console.error('Erreur:', err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion des membres</h1>
        <p style={{ color: '#666' }}>Modifiez le rôle de chaque membre de l'association</p>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#efe',
            color: '#3c3',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {successMessage}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => void loadData()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Actualiser
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                Nom
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                Email
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                Rôle actuel
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                Vérifié
              </th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                Nouveau rôle
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr
                  key={user.userID}
                  style={{
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <td style={{ padding: '1rem' }}>{user.nickname}</td>
                  <td style={{ padding: '1rem' }}>{user.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    >
                      {user.roleLabel}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {user.isVerified ? (
                      <span style={{ color: '#4caf50' }}>✓</span>
                    ) : (
                      <span style={{ color: '#999' }}>✗</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <select
                      value={user.roleID}
                      onChange={e => void handleRoleChange(user.userID, Number(e.target.value))}
                      disabled={updating === user.userID}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        cursor: updating === user.userID ? 'wait' : 'pointer',
                      }}
                    >
                      {roles.map(role => (
                        <option key={role.roleID} value={role.roleID}>
                          {role.roleLabel}
                        </option>
                      ))}
                    </select>
                    {updating === user.userID && (
                      <span style={{ marginLeft: '0.5rem', color: '#666' }}>...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPanel