type QuotesToolbarProps = {
  loading: boolean;
  query: string;
  activeQuery: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onRefresh: () => void;
  onSearch: () => void;
  onReset: () => void;
};

function Toolbar({
  loading,
  query,
  activeQuery,
  onQueryChange,
  onCreate,
  onRefresh,
  onSearch,
  onReset,
}: QuotesToolbarProps) {
  return (
    <div className="quotes__toolbar">
      <div className="quotes__actionsInline">
        <button
          type="button"
          className="btn-primary"
          onClick={onCreate}
          disabled={loading}
        >
          Ajouter une citation
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          Actualiser
        </button>
      </div>

      <div className="quotes__toolbarSearch">
        <input
          type="text"
          className="quotes__input quotes__toolbarInput"
          placeholder="Rechercher une citation ou un auteur"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <button
          type="button"
          className="btn-secondary"
          onClick={onSearch}
          disabled={loading}
        >
          Rechercher
        </button>

        {activeQuery && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
            disabled={loading}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default Toolbar;
