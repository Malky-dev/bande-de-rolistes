import type { SessionInfo } from '@/api/authApi'
import AdminPanel from '@/client/components/AdminPanel'
import ForbiddenView from './ForbiddenView'

type AdminViewProps = {
  session: SessionInfo | null
  onBackHome: () => void
}

function AdminView({ session, onBackHome }: AdminViewProps) {
  if (session?.role !== 'admin') {
    return <ForbiddenView onBackHome={onBackHome} />
  }

  return <AdminPanel />
}

export default AdminView
