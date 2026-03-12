type LocationViewProps = {
  onJoinTable: () => void;
};

function LocationView({ onJoinTable }: LocationViewProps) {
  return (
    <div className="location-wrap">
      <section className="hero location-hero">
        <div className="hero-left">
          <span className="hero-pill">Association · Nos lieux</span>

          <h1 className="hero-title">
            Où <span className="gradient-text">nous retrouver</span> ?
          </h1>

          <p className="hero-subtitle">
            Bande de Rôlistes vit aussi par ses lieux de rencontre. Nous jouons
            à Maurepas dans des espaces qui accueillent nos tables, nos
            campagnes, nos découvertes et tout ce qui fait la vie de
            l&apos;association.
          </p>
        </div>

        <div className="hero-right">
          <div className="hero-card panel">
            <h3>En quelques mots</h3>
            <p>
              Nos lieux sont avant tout des points de rendez-vous pour jouer,
              découvrir de nouvelles tables et faire vivre la communauté dans de
              bonnes conditions.
            </p>
          </div>

          <div className="hero-meta">
            <p>📍 Maurepas</p>
            <p>🏠 Deux lieux repères</p>
            <p>🎲 Un cadre convivial pour jouer</p>
          </div>
        </div>
      </section>

      <section className="panel location-section">
        <div className="panel__header">
          <h2 className="panel__title">Nos lieux à Maurepas</h2>
        </div>

        <p className="panel__subtitle">
          Deux lieux marquent la vie de l&apos;association : l&apos;EVA de
          Maurepas et la Salle Oxford, rue de Bassigny.
        </p>

        <div className="location-places">
          <article className="rpg-block location-place">
            <div className="location-place__content">
              <span className="location-card__icon">🏛️</span>
              <h3>L&apos;EVA de Maurepas</h3>
              <p>
                L&apos;EVA fait partie des lieux associés à l&apos;histoire de
                Bande de Rôlistes. C&apos;est un repère important dans le
                parcours de l&apos;association et dans ses habitudes de
                rencontre à Maurepas.
              </p>
              <div className="location-card__meta">
                <span>Lieu repère de l&apos;association</span>
              </div>
            </div>

            <div className="location-map">
              <iframe
                title="Carte EVA de Maurepas"
                src="https://www.google.com/maps?q=EVA%20Maurepas&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </article>

          <article className="rpg-block location-place">
            <div className="location-place__content">
              <span className="location-card__icon">🏛️</span>
              <h3>Salle Oxford / Maison de Voisinage des Coudrays</h3>
              <p>
                Aujourd&apos;hui, la Salle Oxford de Maurepas, rue de Bassigny,
                constitue l&apos;un des lieux de rendez-vous de
                l&apos;association pour accueillir les tables et partager des
                après-midis de jeu.
              </p>
              <div className="location-card__meta">
                <span>Rue de Bassigny · Maurepas</span>
              </div>
            </div>

            <div className="location-map">
              <iframe
                title="Carte Maison de Voisinage des Coudrays"
                src="https://www.google.com/maps?q=Maison%20de%20Voisinage%20des%20Coudrays%20Maurepas&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </article>
        </div>
      </section>

      <section className="panel location-section">
        <div className="panel__header">
          <h2 className="panel__title">Pourquoi ces lieux comptent</h2>
        </div>

        <div className="location-features">
          <article className="rpg-block">
            <h3>Un point de rencontre</h3>
            <p>
              Ces lieux permettent aux membres de se retrouver régulièrement
              dans un cadre stable, identifiable et accueillant.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Un espace pour jouer</h3>
            <p>
              Une table de jeu de rôle a besoin d&apos;un endroit où l&apos;on
              peut s&apos;installer, discuter, lancer des dés et prendre le
              temps de vivre une aventure ensemble.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Un ancrage local</h3>
            <p>
              Jouer à Maurepas, dans des lieux identifiés, renforce la dimension
              associative et locale de Bande de Rôlistes.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default LocationView;
