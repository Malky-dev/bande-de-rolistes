import { useAdminPanel } from "@/client/components/adminPanel/useAdminPanel";

function AdminPanel() {
  const {
    users,
    roles,
    loading,
    error,
    updating,
    successMessage,
    loadData,
    handleRoleChange,
  } = useAdminPanel();

  if (loading) {
    return (
      <div className="admin admin--loading">
        <p className="admin__loading">Chargement...</p>
      </div>
    );
  }

  return (
    <section className="admin">
      <header className="admin__header">
        <h1 className="admin__title">Gestion des membres</h1>
        <p className="admin__subtitle">
          Modifiez le rôle de chaque membre de l'association
        </p>
      </header>

      {error && <div className="admin__alert admin__alert--error">{error}</div>}

      {successMessage && (
        <div className="admin__alert admin__alert--success">
          {successMessage}
        </div>
      )}

      <div className="admin__actions">
        <button
          className="btn-primary"
          type="button"
          onClick={() => void loadData()}
        >
          Actualiser
        </button>
      </div>

      <div className="admin__tableWrap">
        <table className="admin__table">
          <thead>
            <tr className="admin__theadRow">
              <th className="admin__th">Nom</th>
              <th className="admin__th">Email</th>
              <th className="admin__th">Rôle actuel</th>
              <th className="admin__th">Vérifié</th>
              <th className="admin__th">Nouveau rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin__empty">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userID} className="admin__tr">
                  <td className="admin__td">{user.nickname}</td>
                  <td className="admin__td">{user.email}</td>
                  <td className="admin__td">
                    <span className="admin__badge">{user.roleLabel}</span>
                  </td>
                  <td className="admin__td">
                    {user.isVerified ? (
                      <span className="admin__verified admin__verified--yes">
                        ✓
                      </span>
                    ) : (
                      <span className="admin__verified admin__verified--no">
                        ✗
                      </span>
                    )}
                  </td>
                  <td className="admin__td">
                    <select
                      value={user.roleID}
                      onChange={(e) =>
                        void handleRoleChange(
                          user.userID,
                          Number(e.target.value),
                        )
                      }
                      disabled={updating === user.userID}
                      className="admin__select"
                    >
                      {roles.map((role) => (
                        <option key={role.roleID} value={role.roleID}>
                          {role.roleLabel}
                        </option>
                      ))}
                    </select>
                    {updating === user.userID && (
                      <span className="admin__updating">...</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPanel;
