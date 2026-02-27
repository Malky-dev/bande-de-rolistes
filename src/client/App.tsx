import { useEffect, useState } from 'react'
import './App.css'
import AuthForms from './components/AuthForms'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import type { SessionInfo } from '../types/api/session'
import { apiSession } from '../api/authApi'
import { fetchCsrfToken } from '../api/securityApi'
import HomeView from './views/HomeView'
import AdminView from './views/AdminView'
import RpgTablesView from './views/RpgTablesView'
import AccountView from './views/AccountView'
import ForbiddenView from './views/ForbiddenView'
import CreateRpgTableView from './views/rpg/CreateRpgTableView'
import EditRpgTableView from './views/rpg/EditRpgTableView'
import QuotesView from './views/QuoteView'
import 'react-datepicker/dist/react-datepicker.css'

type View = 'home' | 'login' | 'signup' | 'admin' | 'account' | 'rpg' | 'rpg-create' | 'rpg-edit' | 'quotes'

function App() {
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [editingEventID, setEditingEventID] = useState<number | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const discordError = urlParams.get('error')

    if (discordError) {
      console.error('Erreur Discord OAuth:', discordError)
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    async function checkSession(): Promise<void> {
      try {
        const s = await apiSession()
        setSession(s)
        setView('home')
      } catch {
        setSession(null)
      } finally {
        setCheckingSession(false)
      }
    }

    void checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      const csrfToken = await fetchCsrfToken()
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'include',
      })
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }

    setSession(null)
    setView('home')
  }

  const handleLoginSuccess = (s: SessionInfo) => {
    setSession(s)
    setView('home')
  }

  return (
    <div className="app-root">
      <Navbar
        view={view}
        checkingSession={checkingSession}
        session={session}
        onChangeView={(v) => setView(v)}
        onLogout={() => void handleLogout()}
      />

      <main className="main">
        {view === 'home' && <HomeView />}

        {view === 'rpg' && (
          <RpgTablesView
            session={session}
            onCreateTable={() => setView('rpg-create')}
            onEditTable={(eventID) => {
              setEditingEventID(eventID)
              setView('rpg-edit')
            }}
            onLogin={() => setView('login')}
          />
        )}

        {view === 'rpg-create' && (
          <CreateRpgTableView
            session={session}
            onBack={() => setView('rpg')}
          />
        )}

        {view === 'rpg-edit' && editingEventID !== null && (
          <EditRpgTableView
            session={session}
            eventID={editingEventID}
            onBack={() => setView('rpg')}
          />
        )}

        {view === 'quotes' && (
          <QuotesView 
            session={session} 
            onBackHome={() => setView('home')}
          />
        )}

        {(view === 'login' || view === 'signup') && (
          <AuthForms view={view} 
            onSwitchView={setView}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {view === 'admin' && (
          <AdminView 
            session={session} 
            onBackHome={() => setView('home')}
          />
        )}

        {view === 'account' &&
          (session ? (
            <AccountView
              onBackHome={() => setView('home')}
              onSessionRefresh={(s) => setSession(s)}
            />
          ) : (
            <ForbiddenView
              title="Connexion requise"
              message="Vous devez être connecté pour accéder à votre compte."
              onBackHome={() => setView('login')}
            />
          ))}
      </main>

      <Footer />
    </div>
  )
}

export default App