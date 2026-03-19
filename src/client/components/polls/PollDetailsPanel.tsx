import type { PollDetails } from "../../../types/api/polls";
import type { SessionInfo } from "../../../types/api/session";
import PollOptionsAdmin from "./PollOptionsAdmin";
import PollResults from "./PollResults";
import PollVoteForm from "./PollVoteForm";

type PollDetailsPanelProps = {
  session: SessionInfo | null;
  poll: PollDetails;
  selectedOptionIDs: number[];
  actionLoading?: boolean;
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

export default function PollDetailsPanel({
  session,
  poll,
  selectedOptionIDs,
  actionLoading = false,
  onToggleOption,
  onSubmitVote,
  onDeleteVote,
  onDeletePoll,
  onEditPoll,
  onLogin,
  onOptionsChanged,
}: PollDetailsPanelProps) {
  return (
    <>
      <header>
        <h2>{poll.title}</h2>
        <p>Créé par {poll.createdBy.nickname}</p>
        <p>Fin : {formatDateTime(poll.endAt)}</p>
        <p>État : {poll.isClosed ? "Fermé" : "Ouvert"}</p>
        <p>Nombre maximum de sélections : {poll.maxSelections}</p>
        {poll.description ? <p>{poll.description}</p> : null}
      </header>

      {poll.canManage ? (
        <section>
          <h3>Administration</h3>

          <div>
            <button
              type="button"
              onClick={() => onEditPoll(poll.pollID)}
              disabled={actionLoading}
            >
              Modifier le sondage
            </button>

            <button
              type="button"
              onClick={() => void onDeletePoll()}
              disabled={actionLoading}
            >
              Supprimer le sondage
            </button>
          </div>

          <PollOptionsAdmin
            key={poll.updatedAt}
            poll={poll}
            disabled={actionLoading}
            onChanged={onOptionsChanged}
          />
        </section>
      ) : null}

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

      <PollResults poll={poll} />
    </>
  );
}
