import type { SessionInfo } from "../../types/api/session";
import ForbiddenView from "./ForbiddenView";
import QuotesPanel from "../components/QuotesPanel";

type Props = {
  session: SessionInfo | null;
  onBackHome: () => void;
};

function QuotesView({ session, onBackHome }: Props) {
  if (!session) {
    return (
      <ForbiddenView
        title="Connexion requise"
        message="Vous devez être connecté pour gérer les citations."
        onBackHome={onBackHome}
      />
    );
  }

  if (session.role !== "admin" && session.role !== "organisator") {
    return (
      <ForbiddenView
        title="Accès interdit"
        message="Seuls les admins et organisateurs peuvent gérer les citations."
        onBackHome={onBackHome}
      />
    );
  }

  return <QuotesPanel />;
}

export default QuotesView;
