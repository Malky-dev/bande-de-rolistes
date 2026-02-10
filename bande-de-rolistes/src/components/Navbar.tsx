import type { SessionInfo } from '../authApi'
import logoBDR from '../assets/img/LogoBDR_creme-removebg.png'

type View = 'home' | 'login' | 'signup'

type NavbarProps = {
  view: View
  checkingSession: boolean
  session: SessionInfo | null
  onChangeView: (view: View) => void
  onLogout: () => void
}

function Navbar({ view, checkingSession, session, onChangeView, onLogout }: NavbarProps) {
  return (
    <header className="navbar">
      <div
        className="navbar-logo"
        onClick={() => onChangeView('home')}
        style={{ cursor: 'pointer' }}
      >
        <img src={logoBDR} alt="Bande de Rôlistes" className="navbar-logo-img" />
        <span>Bande de Rôlistes</span>
      </div>

      <nav className="navbar-links">
        <button
          className={`navbar-link navbar-link-button ${
            view === 'home' ? 'navbar-link-active' : ''
          }`}
          onClick={() => onChangeView('home')}
        >
          Accueil
        </button>
        <button className="navbar-link navbar-link-button">Campagnes</button>
        <button className="navbar-link navbar-link-button">Équipe</button>

        {!checkingSession && !session && (
          <>
            <button
              className={`navbar-link navbar-link-button ${
                view === 'login' ? 'navbar-link-active' : ''
              }`}
              onClick={() => onChangeView('login')}
            >
              Connexion
            </button>
            <button
              className={`navbar-link navbar-cta navbar-link-button ${
                view === 'signup' ? 'navbar-link-active' : ''
              }`}
              onClick={() => onChangeView('signup')}
            >
              Inscription
            </button>
          </>
        )}

        {session && (
          <>
            <span className="navbar-link">
              {session.nickname} · {session.role}
            </span>
            <button
              className="navbar-link navbar-link-button"
              onClick={onLogout}
            >
              Déconnexion
            </button>
          </>
        )}
      </nav>
    </header>
  )
}

export default Navbar

