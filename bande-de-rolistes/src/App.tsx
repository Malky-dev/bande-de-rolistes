import { useEffect, useState } from 'react'
import './App.css'
import AuthForms from './components/AuthForms'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import type { SessionInfo } from './authApi'
import { apiSession } from './authApi'

type View = 'home' | 'login' | 'signup'

function App() {
  const [view, setView] = useState<View>('home')
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // Gérer le callback Discord OAuth
    const urlParams = new URLSearchParams(window.location.search)
    const discordToken = urlParams.get('token')
    const discordError = urlParams.get('error')

    if (discordToken) {
      // Token reçu depuis Discord OAuth
      localStorage.setItem('bdr_token', discordToken)
      apiSession(discordToken)
        .then((s) => {
          setSession(s)
          setView('home')
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname)
        })
        .catch(() => {
          localStorage.removeItem('bdr_token')
        })
        .finally(() => setCheckingSession(false))
      return
    }

    if (discordError) {
      console.error('Erreur Discord OAuth:', discordError)
      setCheckingSession(false)
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    // Vérification de session normale
    const token = localStorage.getItem('bdr_token')
    if (!token) {
      setCheckingSession(false)
      return
    }

    apiSession(token)
      .then((s) => {
        setSession(s)
      })
      .catch(() => {
        localStorage.removeItem('bdr_token')
      })
      .finally(() => setCheckingSession(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('bdr_token')
    setSession(null)
    setView('home')
  }

  const handleLoginSuccess = (_token: string, s: SessionInfo) => {
    setSession(s)
    setView('home')
  }

  return (
    <div className="app-root">
      <Navbar
        view={view}
        checkingSession={checkingSession}
        session={session}
        onChangeView={setView}
        onLogout={handleLogout}
      />

      <main className="main">
        {view === 'home' && (
          <section className="hero">
            <div className="hero-left">
              <span className="hero-pill">Bienvenue · Association de jeux de rôles</span>
              <h1 className="hero-title">
                Bienvenue à{' '}
                <span className="gradient-text">Bande de Rôlistes</span>
              </h1>
              <p className="hero-subtitle">
                Nous sommes une association de jeux de rôles qui réunit joueuses et joueurs
                autour de tables conviviales, en présentiel et en ligne. Que tu sois
                débutant curieux ou vétéran des donjons, tu trouveras ici une place à la table.
              </p>
              <p className="hero-subtitle">
                L&apos;association propose des campagnes suivies, des one-shots découverte,
                des ateliers pour apprendre à maîtriser et des soirées à thème autour de
                tous les univers : fantasy, science-fiction, horreur, contemporain...
              </p>

              <div className="hero-actions">
                <button className="btn-primary">Découvrir l&apos;association</button>
                <button className="btn-secondary">Rejoindre une table</button>
              </div>

              <div className="hero-meta">
                <span>🎲 Séances régulières chaque semaine</span>
                <span>📍 En ligne et en présentiel selon les tables</span>
                <span>👥 Ambiance bienveillante et inclusive</span>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-card">
                <div className="hero-card-header">
                  <div>
                    <div className="hero-card-title">Prochaine soirée découverte</div>
                    <div className="hero-card-item-value">
                      Vendredi 21h – Initiation Donjons & Dragons
                    </div>
                  </div>
                  <span className="hero-card-tag">Ouvert aux débutants</span>
                </div>

                <div className="hero-card-list">
                  <div>
                    <div className="hero-card-item-label">Format</div>
                    <div className="hero-card-item-value">
                      One-shot de 3 à 4 heures, personnages fournis
                    </div>
                  </div>
                  <div>
                    <div className="hero-card-item-label">Inscription</div>
                    <div className="hero-card-item-value">
                      Via le site ou le serveur Discord de l&apos;association
                    </div>
                  </div>
                  <div>
                    <div className="hero-card-item-label">Matériel</div>
                    <div className="hero-card-item-value">
                      Un micro, une connexion internet et l&apos;envie de raconter des histoires
                    </div>
                  </div>
                </div>

                <div className="dot-row">
                  <span className="dot dot-accent" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            </div>
          </section>
        )}

        {(view === 'login' || view === 'signup') && (
          <AuthForms
            view={view}
            onSwitchView={setView}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
