import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiDeletePoll,
  apiDeletePollVote,
  apiGetPoll,
  apiListPolls,
  apiReplacePollVote,
} from "@/api/polls";
import PollsView from "@/client/views/PollsView";
import type { PollDetails, PollListItem } from "@/types/api/polls";

vi.mock("@/api/polls", () => ({
  apiListPolls: vi.fn(),
  apiGetPoll: vi.fn(),
  apiReplacePollVote: vi.fn(),
  apiDeletePollVote: vi.fn(),
  apiDeletePoll: vi.fn(),
}));

vi.mock("@/client/components/polls/PollList", () => ({
  default: ({
    polls,
    onSelect,
  }: {
    polls: PollListItem[];
    onSelect: (pollID: number) => void;
  }) => (
    <div>
      {polls.map((poll) => (
        <button key={poll.pollID} onClick={() => onSelect(poll.pollID)}>
          {poll.title}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@/client/components/polls/PollVoteModal", () => ({
  default: ({
    poll,
    selectedOptionIDs,
    actionLoading,
    onToggleOption,
    onSubmitVote,
    onDeleteVote,
    onDeletePoll,
    onClose,
    onEditPoll,
    onOptionsChanged,
  }: {
    poll: PollDetails;
    selectedOptionIDs: number[];
    actionLoading?: boolean;
    onToggleOption: (optionID: number) => void;
    onSubmitVote: () => Promise<void> | void;
    onDeleteVote: () => Promise<void> | void;
    onDeletePoll: () => Promise<void> | void;
    onClose: () => void;
    onEditPoll: (pollID: number) => void;
    onOptionsChanged: (message: string) => Promise<void> | void;
  }) => (
    <div data-testid="mock-vote-modal">
      <div>{`selected:${selectedOptionIDs.join(",")}`}</div>
      <div>{`loading:${String(actionLoading ?? false)}`}</div>
      <button onClick={() => onToggleOption(1)}>toggle-1</button>
      <button onClick={() => onToggleOption(2)}>toggle-2</button>
      <button onClick={() => onToggleOption(3)}>toggle-3</button>
      <button onClick={() => void onSubmitVote()}>submit-vote</button>
      <button onClick={() => void onDeleteVote()}>delete-vote</button>
      <button onClick={() => void onDeletePoll()}>delete-poll</button>
      <button onClick={() => onEditPoll(poll.pollID)}>edit-poll</button>
      <button onClick={() => void onOptionsChanged("Options mises à jour.")}>
        options-changed
      </button>
      <button onClick={onClose}>close-modal</button>
    </div>
  ),
}));

const mockListItem: PollListItem = {
  pollID: 1,
  title: "Poll 1",
  description: "D1",
  endAt: "2026-06-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  createdBy: { userID: 10, nickname: "Alice" },
  maxSelections: 2,
  totalVoters: 0,
  totalVotes: 0,
  isClosed: false,
  canManage: false,
};

const mockDetails: PollDetails = {
  pollID: 1,
  title: "Poll 1",
  description: "D1",
  endAt: "2026-06-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: { userID: 10, nickname: "Alice" },
  maxSelections: 2,
  isClosed: false,
  canVote: true,
  canManage: true,
  myVote: [1, 2],
  options: [
    { optionID: 1, label: "A", displayOrder: 0, voteCount: 0, voters: [] },
    { optionID: 2, label: "B", displayOrder: 1, voteCount: 0, voters: [] },
    { optionID: 3, label: "C", displayOrder: 2, voteCount: 0, voters: [] },
  ],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("PollsView - extra behavior coverage", () => {
  const onCreatePoll = vi.fn();
  const onEditPoll = vi.fn();
  const onLogin = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("affiche la modale de chargement, ne la ferme pas au clic dans le dialog, puis la ferme via l’overlay", async () => {
    const pending = deferred<PollDetails>();

    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockImplementationOnce(() => pending.promise);

    render(
      <PollsView
        session={null}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Chargement du sondage…");

    fireEvent.click(dialog);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const overlay = dialog.parentElement;
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    pending.resolve(mockDetails);
  });

  it("ne supprime pas le sondage si la confirmation est annulée", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));
    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-vote-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("delete-poll"));

    expect(apiDeletePoll).not.toHaveBeenCalled();
  });

  it("affiche l’erreur si la suppression du sondage échoue", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);
    vi.mocked(apiDeletePoll).mockRejectedValue(new Error("delete failed"));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-vote-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("delete-poll"));

    await waitFor(() => {
      expect(screen.getByText("delete failed")).toBeInTheDocument();
    });
  });

  it("rafraîchit le sondage courant après onOptionsChanged et affiche le message de succès", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-vote-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("options-changed"));

    await waitFor(() => {
      expect(screen.getByText("Options mises à jour.")).toBeInTheDocument();
    });

    expect(apiGetPoll).toHaveBeenCalledTimes(2);
    expect(apiListPolls).toHaveBeenCalledTimes(2);
  });

  it("refuse une troisième sélection quand le max est atteint puis permet de désélectionner", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "User",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByText("selected:1,2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("toggle-3"));
    expect(screen.getByText("selected:1,2")).toBeInTheDocument();

    fireEvent.click(screen.getByText("toggle-2"));
    await waitFor(() => {
      expect(screen.getByText("selected:1")).toBeInTheDocument();
    });
  });

  it("bloque le changement de sélection pendant un submit en cours", async () => {
    const submitPending = deferred<string>();

    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue({
      ...mockDetails,
      myVote: [],
      maxSelections: 1,
    });
    vi.mocked(apiReplacePollVote).mockImplementationOnce(
      () => submitPending.promise,
    );

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "User",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByText("selected:")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("submit-vote"));

    await waitFor(() => {
      expect(screen.getByText("loading:true")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("toggle-1"));

    expect(screen.getByText("selected:")).toBeInTheDocument();

    submitPending.resolve("Vote enregistré.");
  });

  it("affiche l’erreur si la suppression du vote échoue", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([mockListItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);
    vi.mocked(apiDeletePollVote).mockRejectedValue(
      new Error("delete vote failed"),
    );

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "User",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-vote-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("delete-vote"));

    await waitFor(() => {
      expect(screen.getByText("delete vote failed")).toBeInTheDocument();
    });
  });

  it("n'ouvre pas de modale de vote quand la liste des sondages est vide", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={null}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-vote-modal")).not.toBeInTheDocument();
  });

  it("ne soumet pas de vote si details est null", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([
      { ...mockListItem, pollID: 1, title: "Poll 1" },
    ]);
    vi.mocked(apiGetPoll).mockRejectedValue(new Error("load details failed"));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "User",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByText("load details failed")).toBeInTheDocument();
    });

    expect(apiReplacePollVote).not.toHaveBeenCalled();
  });

  it("ne supprime pas le vote si details est null", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([
      { ...mockListItem, pollID: 1, title: "Poll 1" },
    ]);
    vi.mocked(apiGetPoll).mockRejectedValue(new Error("load details failed"));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "User",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByText("load details failed")).toBeInTheDocument();
    });

    expect(apiDeletePollVote).not.toHaveBeenCalled();
  });

  it("ne supprime pas le sondage si details est null", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(apiListPolls).mockResolvedValue([
      { ...mockListItem, pollID: 1, title: "Poll 1" },
    ]);
    vi.mocked(apiGetPoll).mockRejectedValue(new Error("load details failed"));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByText("load details failed")).toBeInTheDocument();
    });

    expect(apiDeletePoll).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("réinitialise details et selectedOptionIDs quand selectedPollID redevient null après reload vide", async () => {
    vi.mocked(apiListPolls)
      .mockResolvedValueOnce([mockListItem])
      .mockResolvedValueOnce([]);
    vi.mocked(apiGetPoll).mockResolvedValue(mockDetails);
    vi.mocked(apiDeletePoll).mockResolvedValue("Poll supprimé.");

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={onEditPoll}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Poll 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Poll 1"));

    await waitFor(() => {
      expect(screen.getByTestId("mock-vote-modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("delete-poll"));

    await waitFor(() => {
      expect(screen.queryByTestId("mock-vote-modal")).not.toBeInTheDocument();
    });

    expect(apiDeletePoll).toHaveBeenCalledWith(1);
  });
});
