import type { ReactElement } from "react";

type Props = {
  mode: "forbidden" | "loading" | "load-error" | "not-found";
  message?: string;
  onBack: () => void;
};

export default function PollEditorState({
  mode,
  message,
  onBack,
}: Props): ReactElement {
  if (mode === "forbidden") {
    return <p>Accès refusé.</p>;
  }

  if (mode === "loading") {
    return <p>Chargement…</p>;
  }

  if (mode === "load-error") {
    return (
      <div>
        <p>{message ?? "Impossible de charger le sondage."}</p>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div>
      <p>Sondage introuvable.</p>
      <button type="button" className="btn-secondary" onClick={onBack}>
        Retour
      </button>
    </div>
  );
}
