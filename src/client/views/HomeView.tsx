type HomeViewProps = {
  onDiscover?: () => void;
  onJoinTable?: () => void;
};

function HomeView({ onDiscover, onJoinTable }: HomeViewProps) {
  return (
    <section className="hero">
      <div className="hero-left">
        <span className="hero-pill">
          Bienvenue · Association de jeux de rôles
        </span>
        <h1 className="hero-title">
          Bienvenue à <span className="gradient-text">Bande de Rôlistes</span>
        </h1>
        <p className="hero-subtitle">
          Nous sommes une association de jeux de rôles qui réunit joueuses et
          joueurs autour de tables conviviales, en présentiel et en ligne. Que
          tu sois débutant curieux ou vétéran des donjons, tu trouveras ici une
          place à la table.
        </p>
        <p className="hero-subtitle">
          L&apos;association propose des campagnes suivies, des one-shots
          découverte, des ateliers pour apprendre à maîtriser et des soirées à
          thème autour de tous les univers : fantasy, science-fiction, horreur,
          contemporain...
        </p>

        <div className="hero-actions">
          <button className="btn-primary" type="button" onClick={onDiscover}>
            Découvrir l&apos;association
          </button>
          <button className="btn-secondary" type="button" onClick={onJoinTable}>
            Rejoindre une table
          </button>
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
                Vendredi 21h – Initiation Donjons &amp; Dragons
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
                Un micro, une connexion internet et l&apos;envie de raconter des
                histoires
              </div>
            </div>
          </div>

          <div className="dots-row">
            <span className="dot hot" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeView;
