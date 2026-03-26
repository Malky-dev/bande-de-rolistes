import CreateModal from "@/client/components/quotesPanel/CreateModal";
import Pagination from "@/client/components/quotesPanel/Pagination";
import Table from "@/client/components/quotesPanel/Table";
import Toolbar from "@/client/components/quotesPanel/Toolbar";
import { useQuotesPanel } from "@/client/components/quotesPanel/useQuotesPanel";

function QuotesPanel() {
  const {
    page,
    totalPages,
    items,
    loading,
    query,
    activeQuery,
    error,
    successMessage,
    isCreateModalOpen,
    isSaving,
    isUpdating,
    createForm,
    editId,
    editForm,
    rangeLabel,
    reload,
    setQuery,
    openCreateModal,
    closeCreateModal,
    submitSearch,
    resetSearch,
    submitCreate,
    updateCreateForm,
    startEdit,
    cancelEdit,
    saveEdit,
    updateEditForm,
    deleteQuote,
  } = useQuotesPanel();

  if (loading && items.length === 0) {
    return (
      <section className="admin">
        <p className="admin__loading">Chargement...</p>
      </section>
    );
  }

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

      <Toolbar
        loading={loading}
        query={query}
        activeQuery={activeQuery}
        onQueryChange={setQuery}
        onCreate={openCreateModal}
        onRefresh={() => void reload(page)}
        onSearch={() => void submitSearch()}
        onReset={() => void resetSearch()}
      />

      <div className="admin__tableWrap">
        <Pagination
          page={page}
          totalPages={totalPages}
          loading={loading}
          rangeLabel={rangeLabel}
          onChangePage={(targetPage) => void reload(targetPage)}
        />

        <Table
          items={items}
          editId={editId}
          editContent={editForm.content}
          editAuthor={editForm.author}
          isUpdating={isUpdating}
          onEditContentChange={(value) => updateEditForm("content", value)}
          onEditAuthorChange={(value) => updateEditForm("author", value)}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={() => void saveEdit()}
          onDelete={(quote) => void deleteQuote(quote)}
        />
      </div>

      <CreateModal
        isOpen={isCreateModalOpen}
        content={createForm.content}
        author={createForm.author}
        isSaving={isSaving}
        onClose={closeCreateModal}
        onContentChange={(value) => updateCreateForm("content", value)}
        onAuthorChange={(value) => updateCreateForm("author", value)}
        onSubmit={() => void submitCreate()}
      />
    </section>
  );
}

export default QuotesPanel;
