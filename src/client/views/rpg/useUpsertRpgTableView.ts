import { useEffect, useMemo, useState } from "react";

import { apiGetRpgTable } from "@/api/rpg";
import { canCreateRpgTable, canEditRpgTable } from "@/client/utils/permissions";
import type { RpgTableDetails } from "@/types/api/rpg";
import type { SessionInfo } from "@/types/api/session";

type UseUpsertRpgTableViewArgs = {
  session: SessionInfo | null;
  eventID?: number | null;
};

const LOAD_ERROR_MESSAGE = "Impossible de charger la table";

function buildLoadErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : LOAD_ERROR_MESSAGE;
}

export function useUpsertRpgTableView({
  session,
  eventID,
}: UseUpsertRpgTableViewArgs) {
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

    const run = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const nextTable = await apiGetRpgTable(eventID);

        if (mounted) {
          setTable(nextTable);
        }
      } catch (cause) {
        if (mounted) {
          setError(buildLoadErrorMessage(cause));
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

  return {
    isEdit,
    table,
    error,
    loading,
    canSubmit,
  };
}
