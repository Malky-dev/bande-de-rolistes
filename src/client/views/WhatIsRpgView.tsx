function WhatIsRpgView() {
  return (
    <div className="what-is-rpg-wrap">
      <section className="hero what-is-rpg-hero">
        <div className="hero-left">
          <span className="hero-pill">Découvrir · Le jeu de rôle</span>

          <h1 className="hero-title">
            Le <span className="gradient-text">jeu de rôle</span>, c&apos;est
            quoi ?
          </h1>

          <p className="hero-subtitle">
            Une aventure racontée à plusieurs, où chacun incarne un personnage
            dans un univers partagé.
          </p>
        </div>

        <div className="hero-right">
          <div className="hero-card panel">
            <h3>En une phrase</h3>
            <p>
              Le jeu de rôle, c&apos;est raconter une histoire ensemble, avec
              des personnages, des choix, un peu d&apos;improvisation et juste
              assez de règles pour donner du relief à l&apos;aventure.
            </p>
          </div>

          <div className="hero-meta">
            <p>🎲 Débutants bienvenus</p>
            <p>🌍 Tous styles d&apos;univers</p>
            <p>👥 Une expérience collective</p>
          </div>
        </div>
      </section>

      <section className="panel what-is-rpg-section">
        <div className="panel__header">
          <h2 className="panel__title">Comprendre en 30 secondes</h2>
        </div>

        <p className="panel__subtitle">
          Le principe tient en trois idées simples.
        </p>

        <div className="what-is-rpg-cards">
          <article className="rpg-block what-is-rpg-card">
            <span className="what-is-rpg-card__icon">📖</span>
            <h3>Une histoire collective</h3>
            <p>
              Le groupe construit ensemble une aventure. Les choix des joueurs
              changent réellement ce qu&apos;il se passe.
            </p>
          </article>

          <article className="rpg-block what-is-rpg-card">
            <span className="what-is-rpg-card__icon">🧙</span>
            <h3>Un personnage à incarner</h3>
            <p>
              Chaque joueur joue un personnage avec sa manière d&apos;agir, de
              parler et de prendre des décisions.
            </p>
          </article>

          <article className="rpg-block what-is-rpg-card">
            <span className="what-is-rpg-card__icon">🎲</span>
            <h3>Des dés quand il y a un risque</h3>
            <p>
              Quand une action est incertaine, les règles et les dés permettent
              de savoir ce qui arrive.
            </p>
          </article>
        </div>
      </section>

      <section className="panel what-is-rpg-section">
        <div className="panel__header">
          <h2 className="panel__title">Comment se déroule une partie ?</h2>
        </div>

        <div className="what-is-rpg-steps">
          <article className="what-is-rpg-step">
            <div className="what-is-rpg-step__number">1</div>
            <div>
              <h3>On découvre la situation</h3>
              <p>
                Le maître du jeu présente l&apos;univers, le contexte et le
                point de départ de l&apos;aventure.
              </p>
            </div>
          </article>

          <article className="what-is-rpg-step">
            <div className="what-is-rpg-step__number">2</div>
            <div>
              <h3>Chacun joue son personnage</h3>
              <p>
                On explore, on discute, on enquête, on improvise et on prend des
                décisions ensemble.
              </p>
            </div>
          </article>

          <article className="what-is-rpg-step">
            <div className="what-is-rpg-step__number">3</div>
            <div>
              <h3>Les dés interviennent si besoin</h3>
              <p>
                Lorsqu&apos;une action est risquée ou incertaine, un jet de dés
                aide à déterminer l&apos;issue.
              </p>
            </div>
          </article>

          <article className="what-is-rpg-step">
            <div className="what-is-rpg-step__number">4</div>
            <div>
              <h3>L&apos;histoire évolue avec le groupe</h3>
              <p>
                Réussites, échecs et idées inattendues donnent naissance à une
                aventure unique à chaque table.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="panel what-is-rpg-highlight">
        <div className="panel__header">
          <h2 className="panel__title">Pas besoin d&apos;être expert</h2>
        </div>

        <p className="panel__subtitle">
          Pas besoin de connaître toutes les règles, ni d&apos;avoir déjà joué.
          Les parties d&apos;initiation sont là pour apprendre tranquillement,
          avec une ambiance bienveillante et des explications au fil du jeu.
        </p>
      </section>

      <section className="panel what-is-rpg-section">
        <div className="panel__header">
          <h2 className="panel__title">À quoi t&apos;attendre</h2>
        </div>

        <div className="what-is-rpg-split">
          <article className="rpg-block">
            <h4>Tu vas trouver</h4>
            <ul>
              <li>Une aventure collective</li>
              <li>Des univers variés</li>
              <li>De la coopération</li>
              <li>Des choix qui comptent</li>
              <li>Des moments drôles, tendus ou mémorables</li>
            </ul>
          </article>

          <article className="rpg-block">
            <h4>Tu n&apos;as pas besoin de</h4>
            <ul>
              <li>Tout connaître avant de venir</li>
              <li>Être comédien</li>
              <li>Être à l&apos;aise tout de suite</li>
              <li>Créer un personnage compliqué pour débuter</li>
              <li>Connaître un univers par cœur</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

export default WhatIsRpgView;
