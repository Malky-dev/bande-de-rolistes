import type { QuoteAdmin } from "@/api/auth";

type QuotesTableProps = {
  items: QuoteAdmin[];
  editId: number | null;
  editContent: string;
  editAuthor: string;
  isUpdating: boolean;
  onEditContentChange: (value: string) => void;
  onEditAuthorChange: (value: string) => void;
  onStartEdit: (quote: QuoteAdmin) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (quote: QuoteAdmin) => void;
};

function Table({
  items,
  editId,
  editContent,
  editAuthor,
  isUpdating,
  onEditContentChange,
  onEditAuthorChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: QuotesTableProps) {
  if (items.length === 0) {
    return <div className="admin__empty">Aucune citation trouvée.</div>;
  }

  return (
    <table className="admin__table">
      <thead>
        <tr className="admin__theadRow">
          <th className="admin__th">ID</th>
          <th className="admin__th">Citation</th>
          <th className="admin__th">Auteur</th>
          <th className="admin__th">Actions</th>
        </tr>
      </thead>

      <tbody>
        {items.map((quote) => {
          const isEditing = editId === quote.quoteID;

          return (
            <tr key={quote.quoteID} className="admin__tr">
              <td className="admin__td">{quote.quoteID}</td>

              <td className="admin__td">
                {isEditing ? (
                  <textarea
                    className="quotes__textarea quotes__content"
                    value={editContent}
                    onChange={(event) =>
                      onEditContentChange(event.target.value)
                    }
                  />
                ) : (
                  <div className="quotes__ellipsis">{quote.content}</div>
                )}
              </td>

              <td className="admin__td">
                {isEditing ? (
                  <input
                    type="text"
                    className="quotes__input"
                    value={editAuthor}
                    onChange={(event) => onEditAuthorChange(event.target.value)}
                  />
                ) : (
                  quote.author
                )}
              </td>

              <td className="admin__td">
                <div className="quotes__actionsInline">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={onSaveEdit}
                        disabled={isUpdating}
                      >
                        Enregistrer
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={onCancelEdit}
                        disabled={isUpdating}
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-secondary btn-secondary--xs"
                        onClick={() => onStartEdit(quote)}
                      >
                        Éditer
                      </button>

                      <button
                        type="button"
                        className="btn-secondary btn-secondary--xs"
                        onClick={() => onDelete(quote)}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Table;
