import type { ReactElement } from "react";

import RpgTableForm from "@/client/views/rpg/RpgTableForm";
import { useUpsertRpgTableView } from "@/client/views/rpg/useUpsertRpgTableView";
import type { SessionInfo } from "@/types/api/session";

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
  const { isEdit, table, error, loading, canSubmit } = useUpsertRpgTableView({
    session,
    eventID,
  });

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
