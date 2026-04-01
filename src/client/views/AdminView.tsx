import AdminPanel from "@/client/components/AdminPanel";
import { canAccessAdmin } from "@/client/utils/permissions";
import type { SessionInfo } from "@/types/api/session";
import ForbiddenView from "./ForbiddenView";

type AdminViewProps = {
  session: SessionInfo | null;
  onBackHome: () => void;
};

function AdminView({ session, onBackHome }: AdminViewProps) {
  if (!canAccessAdmin(session)) {
    return <ForbiddenView onBackHome={onBackHome} />;
  }

  return <AdminPanel />;
}

export default AdminView;
