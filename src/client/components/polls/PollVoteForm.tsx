import type { PollDetails } from "../../../types/api/polls";
import type { SessionInfo } from "../../../types/api/session";

type PollVoteFormProps = {
  session: SessionInfo | null;
  poll: PollDetails;
  selectedOptionIDs: number[];
  loading?: boolean;
  onToggleOption: (optionID: number) => void;
  onSubmitVote: () => Promise<void> | void;
  onDeleteVote: () => Promise<void> | void;
  onLogin: () => void;
};

function isChecked(selectedOptionIDs: number[], optionID: number): boolean {
  return selectedOptionIDs.includes(optionID);
}

function sortOptions(poll: PollDetails) {
  return [...poll.options].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.optionID - right.optionID;
  });
}

export default function PollVoteForm({
  session,
  poll,
  selectedOptionIDs,
  loading = false,
  onToggleOption,
  onSubmitVote,
  onDeleteVote,
  onLogin,
}: PollVoteFormProps) {
  const sortedOptions = sortOptions(poll);
  const isSingleChoice = poll.maxSelections === 1;

  if (session === null) {
    return (
      <section className="poll-vote">
        <h3 className="poll-section-title">Vote</h3>
        <p className="poll-help">Connecte-toi pour participer à ce sondage.</p>
        <button type="button" className="btn-primary" onClick={onLogin}>
          Se connecter
        </button>
      </section>
    );
  }

  if (!poll.canVote) {
    return (
      <section className="poll-vote">
        <h3 className="poll-section-title">Vote</h3>
        <p className="poll-help">
          Le vote n’est pas disponible pour ce sondage.
        </p>
      </section>
    );
  }

  return (
    <section className="poll-vote">
      <div className="poll-vote__header">
        <h3 className="poll-section-title">Vote</h3>
      </div>

      <div
        className="poll-vote__options"
        role={isSingleChoice ? "radiogroup" : undefined}
      >
        {sortedOptions.map((option) => {
          const checked = isChecked(selectedOptionIDs, option.optionID);
          const disabled =
            loading ||
            (!checked &&
              !isSingleChoice &&
              selectedOptionIDs.length >= poll.maxSelections);

          return (
            <label
              key={option.optionID}
              className={`poll-option ${checked ? "poll-option--checked" : ""}`}
            >
              <input
                type={isSingleChoice ? "radio" : "checkbox"}
                name={isSingleChoice ? `poll-${poll.pollID}` : undefined}
                checked={checked}
                onChange={() => onToggleOption(option.optionID)}
                disabled={disabled}
              />
              <span className="poll-option__label">{option.label}</span>
            </label>
          );
        })}
      </div>

      <footer className="poll-vote__actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void onSubmitVote()}
          disabled={loading || selectedOptionIDs.length === 0}
        >
          Enregistrer mon vote
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => void onDeleteVote()}
          disabled={loading || poll.myVote.length === 0}
        >
          Supprimer mon vote
        </button>
      </footer>
    </section>
  );
}
