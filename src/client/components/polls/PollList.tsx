import type { PollListItem } from "../../../types/api/polls";

type PollListProps = {
  polls: PollListItem[];
  selectedPollID: number | null;
  loading?: boolean;
  onSelect: (pollID: number) => void;
  onEdit?: (pollID: number) => void;
  canManagePolls?: boolean;
};

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}…`;
}

export default function PollList({
  polls,
  selectedPollID,
  loading = false,
  onSelect,
  onEdit,
  canManagePolls = false,
}: PollListProps) {
  if (loading) {
    return <p className="poll-list__feedback">Chargement des sondages…</p>;
  }

  if (polls.length === 0) {
    return <p className="poll-list__feedback">Aucun sondage disponible.</p>;
  }

  return (
    <div className="poll-cards" role="list" aria-label="Liste des sondages">
      {polls.map((poll) => {
        const isSelected = poll.pollID === selectedPollID;

        return (
          <article
            key={poll.pollID}
            role="listitem"
            className={`poll-card ${isSelected ? "poll-card--active" : ""}`}
          >
            <button
              type="button"
              className="poll-card__main"
              onClick={() => onSelect(poll.pollID)}
              aria-pressed={isSelected}
            >
              <div className="poll-card__header">
                <h3 className="poll-card__title">{poll.title}</h3>

                <span
                  className={`poll-card__status ${
                    poll.isClosed
                      ? "poll-card__status--closed"
                      : "poll-card__status--open"
                  }`}
                >
                  {poll.isClosed ? "Fermé" : "Ouvert"}
                </span>
              </div>

              <p className="poll-card__description">
                {poll.description !== null && poll.description.trim().length > 0
                  ? truncate(poll.description, 120)
                  : "Aucune description."}
              </p>

              <p className="poll-card__author">
                Par <strong>{poll.createdBy.nickname}</strong>
              </p>
            </button>

            {canManagePolls && onEdit !== undefined ? (
              <div className="poll-card__footer">
                <button
                  type="button"
                  className="btn-secondary poll-card__edit"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(poll.pollID);
                  }}
                  aria-label={`Modifier le sondage ${poll.title}`}
                >
                  Modifier
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
