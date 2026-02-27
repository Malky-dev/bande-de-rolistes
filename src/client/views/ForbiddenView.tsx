type ForbiddenViewProps = {
  title?: string
  message?: string
  onBackHome: () => void
}

function ForbiddenView({
  title = 'Accès refusé',
  message = 'Vous devez être administrateur pour accéder à cette page.',
  onBackHome,
}: ForbiddenViewProps) {
  return (
    <section className="panel panel--center">
      <h2 className="panel__title">{title}</h2>
      <p className="panel__subtitle">{message}</p>
      <div className="panel__actions">
        <button className="btn-primary" type="button" onClick={onBackHome}>
          Retour à l&apos;accueil
        </button>
      </div>
    </section>
  )
}

export default ForbiddenView
