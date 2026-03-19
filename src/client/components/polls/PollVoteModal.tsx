import type { PollDetails } from "../../../types/api/polls";
import type { SessionInfo } from "../../../types/api/session";
import PollResults from "./PollResults";
import PollVoteForm from "./PollVoteForm";
import PollOptionsAdmin from "./PollOptionsAdmin";

type PollVoteModalProps = {
  session: SessionInfo | null;
  poll: PollDetails;
  selectedOptionIDs: number[];
  actionLoading?: boolean;
  onClose: () => void;
  onToggleOption: (optionID: number) => void;
  onSubmitVote: () => Promise<void> | void;
  onDeleteVote: () => Promise<void> | void;
  onDeletePoll: () => Promise<void> | void;
  onEditPoll: (pollID: number) => void;
  onLogin: () => void;
  onOptionsChanged: (message: string) => Promise<void> | void;
};

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR");
}

export default function PollVoteModal({
  session,
  poll,
  selectedOptionIDs,
  actionLoading = false,
  onClose,
  onToggleOption,
  onSubmitVote,
  onDeleteVote,
  onDeletePoll,
  onEditPoll,
  onLogin,
  onOptionsChanged,
}: PollVoteModalProps) {
  return (
    <div className="appModal" onClick={onClose}>
      <section
        className="appModal__dialog appModal__dialog--wide poll-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="poll-vote-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="poll-modal__header">
          <div className="poll-modal__heading">
            <p className="poll-modal__eyebrow">Sondage</p>
            <h2 id="poll-vote-modal-title" className="poll-modal__title">
              {poll.title}
            </h2>

            <div className="poll-modal__meta">
              <span>Par {poll.createdBy.nickname}</span>
              <span>•</span>
              <span>Fin : {formatDateTime(poll.endAt)}</span>
              <span>•</span>
              <span>{poll.isClosed ? "Fermé" : "Ouvert"}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
          >
            Fermer
          </button>
        </header>

        {poll.description !== null && poll.description.trim().length > 0 ? (
          <section className="poll-modal__intro">
            <p>{poll.description}</p>
          </section>
        ) : null}

        <div className="poll-modal__body">
          <div className="poll-modal__main">
            <PollVoteForm
              session={session}
              poll={poll}
              selectedOptionIDs={selectedOptionIDs}
              loading={actionLoading}
              onToggleOption={onToggleOption}
              onSubmitVote={onSubmitVote}
              onDeleteVote={onDeleteVote}
              onLogin={onLogin}
            />
          </div>

          <aside className="poll-modal__side">
            <PollResults poll={poll} />
          </aside>
        </div>

        {poll.canManage ? (
          <section className="poll-modal__admin">
            <div className="poll-modal__admin-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onEditPoll(poll.pollID)}
                disabled={actionLoading}
              >
                Modifier le sondage
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => void onDeletePoll()}
                disabled={actionLoading}
              >
                Supprimer le sondage
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}
