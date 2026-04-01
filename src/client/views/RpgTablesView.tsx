import RpgTableList from "@/client/views/rpg/RpgTableList";
import RpgTableDetailsPanel from "@/client/views/rpg/RpgTableDetailsPanel";
import { useRpgTablesView } from "@/client/views/rpg/useRpgTablesView";
import type { SessionInfo } from "@/types/api/session";

type Props = {
  session: SessionInfo | null;
  onCreateTable: () => void;
  onEditTable: (eventID: number) => void;
  onLogin: () => void;
  reloadToken?: number;
};

function RpgTablesView({
  session,
  onCreateTable,
  onEditTable,
  onLogin,
  reloadToken = 0,
}: Props) {
  const {
    loading,
    tables,
    selectedID,
    setSelectedID,
    detailsLoading,
    details,
    actionLoading,
    error,
    success,
    canCreate,
    canEditTable,
    canLoginForSelectedTable,
    canSignupSelectedTable,
    canUnsignupSelectedTable,
    handleSignup,
    handleUnsignup,
  } = useRpgTablesView({ session, reloadToken });

  if (loading) {
    return (
      <section className="panel panel--center">
        <h2 className="panel__title">Tables JDR</h2>
        <p className="panel__subtitle">Chargement…</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">Tables JDR</h2>

        {canCreate ? (
          <div style={{ marginBottom: 16 }}>
            <button
              className="btn-primary"
              type="button"
              onClick={onCreateTable}
            >
              Créer une table
            </button>
          </div>
        ) : null}
      </div>

      <p className="panel__subtitle">
        Inscris-toi sur une table. Les modalités sont définies par le MJ.
      </p>

      <p className="panel__subtitle">
        En l&apos;absence de règles spécifiques, c&apos;est premier arrivé,
        premier servi.
      </p>

      <div className="rpg-grid">
        <aside className="rpg-list">
          <RpgTableList
            tables={tables}
            selectedID={selectedID}
            canEditTable={canEditTable}
            onSelectTable={setSelectedID}
            onEditTable={onEditTable}
          />
        </aside>

        <div className="rpg-detail">
          <RpgTableDetailsPanel
            details={details}
            detailsLoading={detailsLoading}
            actionLoading={actionLoading}
            success={success}
            error={error}
            canLogin={canLoginForSelectedTable}
            canSignup={canSignupSelectedTable}
            canUnsignup={canUnsignupSelectedTable}
            onLogin={onLogin}
            onSignup={() => void handleSignup()}
            onUnsignup={() => void handleUnsignup()}
          />
        </div>
      </div>
    </section>
  );
}

export default RpgTablesView;
