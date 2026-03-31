import { useEffect, useMemo, useState } from "react";

import { apiGetRpgTable, apiListRpgTables } from "@/api/rpg";
import {
  getSignupErrorMessage,
  getSignupSuccessMessage,
  getUnsignupErrorMessage,
  getUnsignupSuccessMessage,
} from "@/client/views/rpg/rpgTableActionMessages";
import {
  signupToRpgTable,
  unsignupFromRpgTable,
} from "@/client/views/rpg/rpgTableActions";
import { getSelectedTableID } from "@/client/views/rpgTablesView.helpers";
import { canCreateRpgTable, canEditRpgTable } from "@/client/utils/permissions";
import type { RpgTableDetails, RpgTableListItem } from "@/types/api/rpg";
import type { SessionInfo } from "@/types/api/session";

type UseRpgTablesViewArgs = {
  session: SessionInfo | null;
  reloadToken: number;
};

export function useRpgTablesView({
  session,
  reloadToken,
}: UseRpgTablesViewArgs) {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<RpgTableListItem[]>([]);
  const [selectedID, setSelectedID] = useState<number | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<RpgTableDetails | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canAct = useMemo(() => session !== null, [session]);
  const canCreate = useMemo(() => canCreateRpgTable(session), [session]);

  const canEditTable = (table: RpgTableListItem): boolean =>
    canEditRpgTable(session, table.dungeonMaster.userID);

  const refreshList = async (): Promise<void> => {
    const list = await apiListRpgTables();
    setTables(list);
    setSelectedID((current) => getSelectedTableID(current, list));
  };

  const refreshDetails = async (eventID: number): Promise<void> => {
    setDetailsLoading(true);

    try {
      const nextDetails = await apiGetRpgTable(eventID);
      setDetails(nextDetails);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const safeSet = (fn: () => void): void => {
      if (!cancelled) {
        fn();
      }
    };

    const load = async (): Promise<void> => {
      try {
        const list = await apiListRpgTables();

        safeSet(() => {
          setTables(list);
          setSelectedID(getSelectedTableID(null, list));
        });
      } catch (cause) {
        safeSet(() => {
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger les tables",
          );
        });
      } finally {
        safeSet(() => {
          setLoading(false);
        });
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (selectedID === null) {
      setDetails(null);
      return;
    }

    const eventID = selectedID;
    let cancelled = false;

    const safeSet = (fn: () => void): void => {
      if (!cancelled) {
        fn();
      }
    };

    const loadDetails = async (): Promise<void> => {
      safeSet(() => {
        setError(null);
        setSuccess(null);
        setDetailsLoading(true);
      });

      try {
        const nextDetails = await apiGetRpgTable(eventID);
        safeSet(() => {
          setDetails(nextDetails);
        });
      } catch (cause) {
        safeSet(() => {
          setDetails(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Impossible de charger la table",
          );
        });
      } finally {
        safeSet(() => {
          setDetailsLoading(false);
        });
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedID]);

  const isSignedUp =
    details !== null &&
    session !== null &&
    details.confirmed.some((player) => player.userID === session.userID);

  const isOnWaitingList =
    details !== null &&
    session !== null &&
    details.waitlist.some((player) => player.userID === session.userID);

  const canSignupSelectedTable =
    details !== null &&
    canAct &&
    details.status === "OPEN" &&
    !isSignedUp &&
    !isOnWaitingList;

  const canUnsignupSelectedTable =
    details !== null &&
    canAct &&
    details.status === "OPEN" &&
    (isSignedUp || isOnWaitingList);

  const canLoginForSelectedTable =
    details !== null && !canAct && details.status === "OPEN";

  const handleSignup = async (): Promise<void> => {
    if (details === null) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await signupToRpgTable(details.eventID);
      await refreshDetails(details.eventID);
      await refreshList();
      setSuccess(getSignupSuccessMessage());
    } catch (cause) {
      setError(getSignupErrorMessage(cause));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsignup = async (): Promise<void> => {
    if (details === null) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await unsignupFromRpgTable(details.eventID);
      await refreshDetails(details.eventID);
      await refreshList();
      setSuccess(getUnsignupSuccessMessage());
    } catch (cause) {
      setError(getUnsignupErrorMessage(cause));
    } finally {
      setActionLoading(false);
    }
  };

  return {
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
  };
}
