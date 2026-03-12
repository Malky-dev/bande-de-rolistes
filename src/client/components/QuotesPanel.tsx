import { QUOTES_PAGE_SIZE } from "../../shared/constants";
import { useEffect, useMemo, useState } from "react";
import {
  apiQuotesCreate,
  apiQuotesDelete,
  apiQuotesList,
  apiQuotesUpdate,
  type QuoteAdmin,
} from "../../api/authApi";
import {
  buildQuotesPageWindow,
  getQuotesRangeLabel,
  getQuotesReloadPageAfterDelete,
} from "./quotesPanel.helpers";

function QuotesPanel() {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<QuoteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [updating, setUpdating] = useState(false);

  async function reload(targetPage = page, q = activeQuery): Promise<void> {
    try {
      setLoading(true);
      setError(null);

      const data = await apiQuotesList(targetPage, QUOTES_PAGE_SIZE, q);
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toastOk(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 2000);
  }

  function openCreateModal() {
    setError(null);
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (saving) return;
    setIsCreateModalOpen(false);
    setNewContent("");
    setNewAuthor("");
  }

  const rangeLabel = useMemo(() => {
    return getQuotesRangeLabel(page, totalItems, QUOTES_PAGE_SIZE);
  }, [page, totalItems]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiQuotesCreate({ content: newContent, author: newAuthor });
      setNewContent("");
      setNewAuthor("");
      setIsCreateModalOpen(false);
      toastOk("Citation ajoutée");
      await reload(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'ajout");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(q: QuoteAdmin) {
    setEditId(q.quoteID);
    setEditContent(q.content);
    setEditAuthor(q.author);
  }

  function cancelEdit() {
    setEditId(null);
    setEditContent("");
    setEditAuthor("");
  }

  async function saveEdit() {
    if (editId === null) return;

    setUpdating(true);
    setError(null);

    try {
      await apiQuotesUpdate(editId, {
        content: editContent,
        author: editAuthor,
      });
      toastOk("Citation mise à jour");
      cancelEdit();
      await reload(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur update");
    } finally {
      setUpdating(false);
    }
  }

  async function onDelete(q: QuoteAdmin) {
    const ok = window.confirm(`Supprimer la citation #${q.quoteID} ?`);
    if (!ok) return;

    setError(null);

    try {
      await apiQuotesDelete(q.quoteID);
      toastOk("Citation supprimée");
      await reload(getQuotesReloadPageAfterDelete(items.length, page));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression");
    }
  }

  if (loading && items.length === 0) {
    return <div className="admin admin--loading">Chargement...</div>;
  }

  const pageWindow = buildQuotesPageWindow(page, totalPages, 3);

  return (
    <section className="admin">
      <header className="admin__header">
        <h1 className="admin__title">Gestion des citations</h1>
        <p className="admin__subtitle">CRUD + pagination (10 par page)</p>
      </header>

      {error && <div className="admin__alert admin__alert--error">{error}</div>}
      {successMessage && (
        <div className="admin__alert admin__alert--success">
          {successMessage}
        </div>
      )}

      <div className="quotes__toolbar">
        <button className="btn-primary" type="button" onClick={openCreateModal}>
          Ajouter une citation
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            setActiveQuery(q);
            void reload(1, q);
          }}
          className="quotes__toolbarSearch"
        >
          <input
            className="quotes__input quotes__toolbarInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (contenu ou auteur)..."
          />

          <button
            className="btn-secondary"
            type="button"
            onClick={() => void reload(page)}
            disabled={loading}
          >
            Actualiser
          </button>

          <button className="btn-secondary" type="submit" disabled={loading}>
            Rechercher
          </button>

          <button
            className="btn-secondary"
            type="button"
            disabled={loading || (query === "" && activeQuery === "")}
            onClick={() => {
              setQuery("");
              setActiveQuery("");
              void reload(1, "");
            }}
          >
            Reset
          </button>
        </form>
      </div>

      <div className="admin__tableWrap">
        <div className="quotes__pagination">
          <div className="quotes__paginationInfo">{rangeLabel}</div>

          <div className="quotes__paginationControls">
            <button
              className="btn-secondary btn-secondary--small"
              onClick={() => void reload(page - 1)}
              disabled={page <= 1 || loading}
              type="button"
            >
              ◀
            </button>

            {pageWindow.length > 0 && pageWindow[0] > 1 && (
              <>
                <button
                  className="btn-secondary btn-secondary--small"
                  type="button"
                  disabled={loading}
                  onClick={() => void reload(1)}
                  title="Aller page 1"
                >
                  1
                </button>
                {pageWindow[0] > 2 && (
                  <span style={{ opacity: 0.7, padding: "0 6px" }}>...</span>
                )}
              </>
            )}

            {pageWindow.map((p) => (
              <button
                key={p}
                type="button"
                disabled={loading || p === page}
                className={
                  p === page
                    ? "btn-primary btn-primary--small"
                    : "btn-secondary btn-secondary--small"
                }
                onClick={() => void reload(p)}
                title={`Aller page ${p}`}
              >
                {p}
              </button>
            ))}

            {pageWindow.length > 0 &&
              pageWindow[pageWindow.length - 1] < totalPages && (
                <>
                  {pageWindow[pageWindow.length - 1] < totalPages - 1 && (
                    <span style={{ opacity: 0.7, padding: "0 6px" }}>...</span>
                  )}
                  <button
                    className="btn-secondary btn-secondary--small"
                    type="button"
                    disabled={loading}
                    onClick={() => void reload(totalPages)}
                    title={`Aller page ${totalPages}`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

            <button
              className="btn-secondary btn-secondary--small"
              onClick={() => void reload(page + 1)}
              disabled={page >= totalPages || loading}
              type="button"
            >
              ▶
            </button>
          </div>
        </div>

        <table className="admin__table">
          <thead>
            <tr className="admin__theadRow">
              <th className="admin__th">Citation</th>
              <th className="admin__th">Auteur</th>
              <th className="admin__th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="admin__empty">
                  Aucune citation
                </td>
              </tr>
            ) : (
              items.map((q) => {
                const editing = editId === q.quoteID;

                return (
                  <tr key={q.quoteID} className="admin__tr">
                    <td className="admin__td">
                      {editing ? (
                        <textarea
                          className="quotes__textarea"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <span style={{ fontStyle: "italic" }}>
                          « {q.content} »
                        </span>
                      )}
                    </td>

                    <td className="admin__td">
                      {editing ? (
                        <input
                          className="quotes__input"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                        />
                      ) : (
                        q.author
                      )}
                    </td>

                    <td className="admin__td">
                      {editing ? (
                        <div className="quotes__actionsInline">
                          <button
                            className="btn-primary"
                            type="button"
                            onClick={() => void saveEdit()}
                            disabled={updating}
                          >
                            {updating ? "..." : "Enregistrer"}
                          </button>
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={cancelEdit}
                            disabled={updating}
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <div className="quotes__actionsInline">
                          <button
                            className="btn-secondary btn-secondary--small"
                            type="button"
                            onClick={() => startEdit(q)}
                          >
                            Éditer
                          </button>
                          <button
                            className="btn-secondary btn-secondary--small"
                            type="button"
                            onClick={() => void onDelete(q)}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <div
          className="quotesModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quotes-create-title"
          onClick={closeCreateModal}
        >
          <div
            className="quotesModal__dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="quotesModal__header">
              <h2 id="quotes-create-title" className="quotesModal__title">
                Ajouter une citation
              </h2>

              <button
                type="button"
                className="quotesModal__close"
                onClick={closeCreateModal}
                aria-label="Fermer"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => void onCreate(e)} className="quotes__form">
              <textarea
                className="quotes__textarea"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                placeholder="Texte de la citation"
                required
              />

              <input
                className="quotes__input"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Auteur (optionnel)"
              />

              <div className="quotesModal__footer">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={closeCreateModal}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? "..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default QuotesPanel;
