import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { apiGetRpgTable } from "@/api/rpg";
import { canCreateRpgTable, canEditRpgTable } from "@/client/utils/permissions";
import type { RpgTableDetails } from "@/types/api/rpg";
import type { SessionInfo } from "@/types/api/session";
import RpgTableForm from "./RpgTableForm";

type Props = {
  session: SessionInfo | null;
  eventID?: number | null;
  onBack: () => void;
  onDone: () => void;
};

export default function UpsertRpgTableView({
  session,
  eventID,
  onBack,
  onDone,
}: Props): ReactElement {
  const isEdit = typeof eventID === "number";
  const [table, setTable] = useState<RpgTableDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      setTable(null);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextTable = await apiGetRpgTable(eventID);
        if (mounted) {
          setTable(nextTable);
        }
      } catch (cause) {
        if (mounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger la table",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [isEdit, eventID]);

  const canSubmit = useMemo(() => {
    if (isEdit) {
      return canEditRpgTable(session, table?.dungeonMaster.userID);
    }

    return canCreateRpgTable(session);
  }, [isEdit, session, table]);

  if (isEdit) {
    if (loading) {
      return <div>Chargement…</div>;
    }

    if (error !== null) {
      return <div>{error}</div>;
    }

    if (table === null) {
      return <div>Table introuvable.</div>;
    }

    return (
      <RpgTableForm
        mode="edit"
        canSubmit={canSubmit}
        table={table}
        onBack={onBack}
        onDone={onDone}
      />
    );
  }

  return (
    <RpgTableForm
      mode="create"
      canSubmit={canSubmit}
      onBack={onBack}
      onDone={onDone}
    />
  );
}
