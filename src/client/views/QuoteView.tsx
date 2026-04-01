import QuotesPanel from "@/client/components/QuotesPanel";
import { canManageQuotes } from "@/client/utils/permissions";
import type { SessionInfo } from "@/types/api/session";
import ForbiddenView from "./ForbiddenView";

type Props = {
  session: SessionInfo | null;
  onBackHome: () => void;
};

function QuoteView({ session, onBackHome }: Props) {
  if (session === null) {
    return (
      <ForbiddenView
        title="Connexion requise"
        message="Vous devez être connecté pour gérer les citations."
        onBackHome={onBackHome}
      />
    );
  }

  if (!canManageQuotes(session)) {
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

export default QuoteView;
