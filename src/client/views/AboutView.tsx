type AboutViewProps = {
  onJoinTable: () => void;
};

function AboutView({ onJoinTable }: AboutViewProps) {
  return (
    <div className="about-wrap">
      <section className="hero about-hero">
        <div className="hero-left">
          <span className="hero-pill">Association · Qui sommes-nous ?</span>

          <h1 className="hero-title">
            Une <span className="gradient-text">bande de rôlistes</span>, tout
            simplement
          </h1>

          <p className="hero-subtitle">
            Bande de Rôlistes est une association de passionnés réunis autour
            d&apos;une même envie : raconter des histoires ensemble, partager
            des univers marquants et faire vivre une communauté conviviale
            autour du jeu de rôle.
          </p>
        </div>

        <div className="hero-right">
          <div className="hero-card panel">
            <h3>En quelques mots</h3>
            <p>
              Une association construite autour du plaisir de jouer, de faire
              découvrir le jeu de rôle et de créer des tables où chacun peut
              trouver sa place.
            </p>
          </div>

          <div className="hero-meta">
            <p>📍 Une association locale</p>
            <p>🕒 Des rendez-vous réguliers</p>
            <p>🎲 Débutants et habitués bienvenus</p>
          </div>
        </div>
      </section>

      <section className="panel about-section">
        <div className="panel__header">
          <h2 className="panel__title">Notre histoire</h2>
        </div>

        <p className="panel__subtitle">
          Bande de Rôlistes est née de l&apos;envie de réunir des joueuses et
          des joueurs dans un cadre chaleureux, vivant et régulier.
        </p>

        <div className="about-story-grid">
          <article className="rpg-block">
            <h3>Une association de passionnés</h3>
            <p>
              L&apos;association s&apos;est construite autour d&apos;une idée
              simple : proposer un espace où l&apos;on peut jouer, découvrir de
              nouveaux univers, rencontrer d&apos;autres passionnés et partager
              de vrais bons moments autour d&apos;une table.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Une communauté qui grandit</h3>
            <p>
              Au fil des parties, Bande de Rôlistes a rassemblé des profils
              différents, des curieux, des débutants, des habitués et des
              maîtres du jeu désireux de transmettre leur passion.
            </p>
          </article>
        </div>
      </section>

      <section className="panel about-section">
        <div className="panel__header">
          <h2 className="panel__title">Ce que nous proposons</h2>
        </div>

        <p className="panel__subtitle">
          Des parties pour découvrir, explorer et vivre des aventures dans des
          styles très variés.
        </p>

        <div className="about-cards">
          <article className="rpg-block about-card">
            <span className="about-card__icon">🎭</span>
            <h3>Des formats variés</h3>
            <p>
              Parties d&apos;initiation, one-shots, campagnes plus longues :
              chacun peut trouver un format adapté à son rythme et à son envie
              du moment.
            </p>
          </article>

          <article className="rpg-block about-card">
            <span className="about-card__icon">🌌</span>
            <h3>Des univers multiples</h3>
            <p>
              Fantasy, horreur, enquête, science-fiction, contemporain ou
              intrigues plus sombres : nous aimons varier les ambiances et les
              propositions de jeu.
            </p>
          </article>

          <article className="rpg-block about-card">
            <span className="about-card__icon">🤝</span>
            <h3>Un accueil accessible</h3>
            <p>
              Pas besoin d&apos;être expert pour venir. Nous tenons à proposer
              des tables accueillantes, où l&apos;on peut apprendre, tester et
              progresser sans pression.
            </p>
          </article>
        </div>
      </section>

      <section className="panel about-section">
        <div className="panel__header">
          <h2 className="panel__title">Notre esprit</h2>
        </div>

        <div className="about-values">
          <article className="rpg-block">
            <h3>Convivialité</h3>
            <p>
              Le jeu de rôle est pour nous un moment de partage. L&apos;ambiance
              de table compte autant que le scénario.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Transmission</h3>
            <p>
              Nous aimons faire découvrir le hobby, expliquer les bases et
              donner envie à de nouvelles personnes de se lancer.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Diversité</h3>
            <p>
              Nous défendons une pratique ouverte, avec des styles de jeu, des
              univers et des sensibilités variés.
            </p>
          </article>

          <article className="rpg-block">
            <h3>Passion</h3>
            <p>
              Ce qui nous rassemble, c&apos;est le plaisir de jouer ensemble et
              de faire naître des aventures qu&apos;aucune table ne vivra
              exactement de la même façon.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default AboutView;
