import { useState } from 'react'
import type { SessionInfo } from '../../types/api/session'
import { apiLogin, apiSession, apiSignin } from '../../api/authApi'

type View = 'home' | 'login' | 'signup'

type AuthFormsProps = {
  view: View
  onSwitchView: (view: View) => void
  onLoginSuccess: (session: SessionInfo) => void
}

function AuthForms({ view, onSwitchView, onLoginSuccess }: AuthFormsProps) {
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLogin = view === 'login'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!isLogin && password !== passwordCheck) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    Promise.resolve()
    .then(async () => {
      if (isLogin) {
        await apiLogin(email, password)
      } else {
        await apiSignin(nickname, email, password, passwordCheck)
        await apiLogin(email, password)
      }
    })
    .then(async () => {
      const session = await apiSession()
      onLoginSuccess(session)
    })
    .catch ((err: Error) => {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    }).finally(() => {
      setLoading(false)
    })
  }

  return (
    <section className="hero">
      <div className="hero-left">
        <span className="hero-pill">
          {isLogin ? 'Connexion' : 'Inscription'} · Bande de Rôlistes
        </span>
        <h1 className="hero-title">
          {isLogin ? 'Rejoins la table' : 'Crée ton compte aventurier'}
        </h1>
        <p className="hero-subtitle">
          {isLogin
            ? 'Connecte-toi pour rejoindre les campagnes, suivre tes personnages et retrouver ta communauté.'
            : 'En quelques clics, crée ton profil, choisis ton pseudo et prépare-toi à lancer les dés.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="auth-field">
              <label>Pseudo</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Mot de passe - pour les tests : Jdlduensiokj12</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="auth-field">
              <label>Vérification du Mot de passe</label>
              <input
                type="password"
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
                required
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}

          <div className="hero-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading
                ? 'Patiente...'
                : isLogin
                  ? 'Se connecter'
                  : "Créer mon compte"}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => onSwitchView(isLogin ? 'signup' : 'login')}
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          <div className="auth-divider">
            <span>ou</span>
          </div>

          <button
            className="btn-discord"
            type="button"
            onClick={() => window.location.href = '/api/discord/init'}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {isLogin ? 'Se connecter avec Discord' : "S'inscrire avec Discord"}
          </button>
        </form>
      </div>

      <div className="hero-right">
        <div className="hero-card">
          <div className="hero-card-header">
            <div>
              <div className="hero-card-title">Sécurité</div>
              <div className="hero-card-item-value">
                Connexions sécurisées & gestion de session
              </div>
            </div>
            <span className="hero-card-tag">Chiffrage côté serveur</span>
          </div>

          <div className="hero-card-list">
            <div>
              <div className="hero-card-item-label">Cookies & token</div>
              <div className="hero-card-item-value">
                Connexion persistante sur tes appareils favoris
              </div>
            </div>
            <div>
              <div className="hero-card-item-label">Rôles</div>
              <div className="hero-card-item-value">
                Joueur, MJ, organisateur, admin pour gérer la communauté
              </div>
            </div>
            <div>
              <div className="hero-card-item-label">Contrôle</div>
              <div className="hero-card-item-value">
                Tu peux te déconnecter à tout moment en un clic
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
  )
}

export default AuthForms
