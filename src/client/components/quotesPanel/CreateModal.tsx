import { AppModal } from "@/client/components/AppModal";

type CreateQuoteModalProps = {
  isOpen: boolean;
  content: string;
  author: string;
  isSaving: boolean;
  onClose: () => void;
  onContentChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onSubmit: () => void;
};

function CreateModal({
  isOpen,
  content,
  author,
  isSaving,
  onClose,
  onContentChange,
  onAuthorChange,
  onSubmit,
}: CreateQuoteModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onRequestClose={onClose}
      overlayClassName="quotesModal"
      contentClassName="quotesModal__dialog"
      overlayTestId="quotes-modal-overlay"
      contentTestId="quotes-modal-content"
    >
      <div className="quotesModal__header">
        <h2 className="quotesModal__title">Ajouter une citation</h2>
        <button
          type="button"
          className="quotesModal__close"
          aria-label="Fermer la modale"
          onClick={onClose}
          disabled={isSaving}
        >
          ×
        </button>
      </div>

      <div className="quotes__form">
        <div>
          <label htmlFor="quote-content">Citation</label>
          <textarea
            id="quote-content"
            className="quotes__textarea quotes__content"
            placeholder="Texte de la citation"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="quote-author">Auteur</label>
          <input
            id="quote-author"
            type="text"
            className="quotes__input"
            placeholder="Auteur (optionnel)"
            value={author}
            onChange={(event) => onAuthorChange(event.target.value)}
          />
        </div>
      </div>

      <div className="quotesModal__footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={isSaving}
        >
          Annuler
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onSubmit}
          disabled={isSaving}
        >
          Ajouter
        </button>
      </div>
    </AppModal>
  );
}

export default CreateModal;
