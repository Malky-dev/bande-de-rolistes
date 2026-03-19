import { useEffect, useState } from "react";
import {
  apiDeletePoll,
  apiDeletePollVote,
  apiGetPoll,
  apiListPolls,
  apiReplacePollVote,
} from "../../api/pollsApi";
import PollVoteModal from "../components/polls/PollVoteModal";
import PollList from "../components/polls/PollList";
import {
  canCreatePoll,
  computeNextSelectedOptionIDs,
  getPollsViewErrorMessage,
} from "./polls/pollsView.helpers";
import type { PollDetails, PollListItem } from "../../types/api/polls";
import type { SessionInfo } from "../../types/api/session";

type PollsViewProps = {
  session: SessionInfo | null;
  reloadToken?: number;
  onCreatePoll: () => void;
  onEditPoll: (pollID: number) => void;
  onLogin: () => void;
};

export default function PollsView({
  session,
  reloadToken = 0,
  onCreatePoll,
  onEditPoll,
  onLogin,
}: PollsViewProps) {
  const [polls, setPolls] = useState<PollListItem[]>([]);
  const [selectedPollID, setSelectedPollID] = useState<number | null>(null);
  const [selectedOptionIDs, setSelectedOptionIDs] = useState<number[]>([]);
  const [details, setDetails] = useState<PollDetails | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  async function loadPolls(): Promise<void> {
    setLoadingList(true);
    setErrorMessage(null);

    try {
      const nextPolls = await apiListPolls();
      setPolls(nextPolls);

      if (nextPolls.length === 0) {
        setSelectedPollID(null);
        setDetails(null);
        setSelectedOptionIDs([]);
        setIsVoteModalOpen(false);
        return;
      }

      const hasSelection =
        selectedPollID !== null &&
        nextPolls.some((poll) => poll.pollID === selectedPollID);

      if (!hasSelection) {
        setSelectedPollID(nextPolls[0].pollID);
      }
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger les sondages.",
      );
    } finally {
      setLoadingList(false);
    }
  }

  async function loadPollDetails(pollID: number): Promise<void> {
    setLoadingDetails(true);
    setErrorMessage(null);

    try {
      const nextDetails = await apiGetPoll(pollID);
      setDetails(nextDetails);
      setSelectedOptionIDs(nextDetails.myVote);
    } catch (cause) {
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger le détail du sondage.",
      );
      setDetails(null);
      setSelectedOptionIDs([]);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function refreshCurrentPoll(message?: string): Promise<void> {
    if (selectedPollID !== null) {
      await loadPollDetails(selectedPollID);
    }

    await loadPolls();

    if (message !== undefined) {
      setSuccessMessage(message);
    }
  }

  useEffect(() => {
    void loadPolls();
  }, [reloadToken]);

  useEffect(() => {
    if (selectedPollID === null) {
      setDetails(null);
      setSelectedOptionIDs([]);
      return;
    }

    void loadPollDetails(selectedPollID);
  }, [selectedPollID, reloadToken]);

  function handleOpenVoteModal(pollID: number): void {
    setSelectedPollID(pollID);
    setIsVoteModalOpen(true);
  }

  function handleCloseVoteModal(): void {
    setIsVoteModalOpen(false);
  }

  function handleToggleOption(optionID: number): void {
    setSelectedOptionIDs((current) =>
      computeNextSelectedOptionIDs({
        details,
        actionLoading,
        selectedOptionIDs: current,
        optionID,
      }),
    );
  }

  async function handleSubmitVote(): Promise<void> {
    /* v8 ignore next -- @preserve */
    if (details === null) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const message = await apiReplacePollVote(details.pollID, {
        optionIDs: selectedOptionIDs,
      });

      await refreshCurrentPoll(message);
    } catch (cause) {
      setErrorMessage(
        getPollsViewErrorMessage(cause, "Impossible d'enregistrer le vote."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteVote(): Promise<void> {
    /* v8 ignore next -- @preserve */
    if (details === null) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const message = await apiDeletePollVote(details.pollID);
      await refreshCurrentPoll(message);
    } catch (cause) {
      setErrorMessage(
        getPollsViewErrorMessage(cause, "Impossible de supprimer le vote."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeletePoll(): Promise<void> {
    /* v8 ignore next -- @preserve */
    if (details === null) {
      return;
    }

    const confirmed = window.confirm(
      "Supprimer ce sondage ? Cette action est irréversible.",
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const message = await apiDeletePoll(details.pollID);
      setDetails(null);
      setSelectedOptionIDs([]);
      setIsVoteModalOpen(false);
      await loadPolls();
      setSuccessMessage(message);
    } catch (cause) {
      setErrorMessage(
        getPollsViewErrorMessage(cause, "Impossible de supprimer le sondage."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="poll-page">
      <header className="poll-page__header">
        <div>
          <h1 className="poll-page__title">Sondages</h1>
          <p className="poll-page__subtitle">
            Consultation publique, vote authentifié, résultats visibles en
            direct.
          </p>
        </div>

        {canCreatePoll(session) ? (
          <button type="button" className="btn-primary" onClick={onCreatePoll}>
            Créer un sondage
          </button>
        ) : null}
      </header>

      {errorMessage !== null ? (
        <p className="poll-page__feedback poll-page__feedback--error">
          {errorMessage}
        </p>
      ) : null}

      {successMessage !== null ? (
        <p className="poll-page__feedback poll-page__feedback--success">
          {successMessage}
        </p>
      ) : null}

      <PollList
        polls={polls}
        selectedPollID={selectedPollID}
        loading={loadingList}
        onSelect={handleOpenVoteModal}
        onEdit={onEditPoll}
        canManagePolls={canCreatePoll(session)}
      />

      {isVoteModalOpen && loadingDetails ? (
        <div className="appModal" onClick={handleCloseVoteModal}>
          <section
            className="appModal__dialog poll-modal poll-modal--loading"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            Chargement du sondage…
          </section>
        </div>
      ) : null}

      {isVoteModalOpen && details !== null && !loadingDetails ? (
        <PollVoteModal
          session={session}
          poll={details}
          selectedOptionIDs={selectedOptionIDs}
          actionLoading={actionLoading}
          onClose={handleCloseVoteModal}
          onToggleOption={handleToggleOption}
          onSubmitVote={handleSubmitVote}
          onDeleteVote={handleDeleteVote}
          onDeletePoll={handleDeletePoll}
          onEditPoll={onEditPoll}
          onLogin={onLogin}
          onOptionsChanged={async (message) => {
            setErrorMessage(null);
            await refreshCurrentPoll(message);
          }}
        />
      ) : null}
    </section>
  );
}
