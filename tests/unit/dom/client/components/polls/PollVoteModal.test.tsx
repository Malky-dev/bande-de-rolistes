import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PollVoteModal from "@/client/components/polls/PollVoteModal";
import type { PollDetails } from "@/types/api/polls";
import type { SessionInfo } from "@/types/api/session";

vi.mock("@/client/components/polls/PollVoteForm", () => ({
  default: ({
    poll,
    selectedOptionIDs,
    loading,
    onToggleOption,
    onSubmitVote,
    onDeleteVote,
    session,
    onLogin,
  }: {
    poll: PollDetails;
    selectedOptionIDs: number[];
    loading?: boolean;
    onToggleOption: (optionID: number) => void;
    onSubmitVote: () => void;
    onDeleteVote: () => void;
    session: SessionInfo | null;
    onLogin: () => void;
  }) => (
    <div>
      <div>{`voteform:${poll.pollID}`}</div>
      <div>{`selected:${selectedOptionIDs.join(",")}`}</div>
      <div>{`loading:${String(Boolean(loading))}`}</div>
      <div>{`session:${session ? "yes" : "no"}`}</div>
      <button onClick={() => onToggleOption(1)}>toggle-option</button>
      <button onClick={onSubmitVote}>submit-vote</button>
      <button onClick={onDeleteVote}>delete-vote</button>
      <button onClick={onLogin}>login</button>
    </div>
  ),
}));

vi.mock("@/client/components/polls/PollResults", () => ({
  default: ({ poll }: { poll: PollDetails }) => (
    <div>{`results:${poll.pollID}`}</div>
  ),
}));

const basePoll: PollDetails = {
  pollID: 1,
  title: "Modal Poll",
  description: "Desc",
  endAt: "2026-06-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: { userID: 10, nickname: "Alice" },
  maxSelections: 1,
  isClosed: false,
  canVote: true,
  canManage: false,
  myVote: [],
  options: [
    { optionID: 1, label: "A", displayOrder: 0, voteCount: 0, voters: [] },
    { optionID: 2, label: "B", displayOrder: 1, voteCount: 0, voters: [] },
  ],
};

describe("PollVoteModal", () => {
  const defaultProps = {
    session: null,
    poll: basePoll,
    selectedOptionIDs: [] as number[],
    actionLoading: false,
    onClose: vi.fn(),
    onToggleOption: vi.fn(),
    onSubmitVote: vi.fn(),
    onDeleteVote: vi.fn(),
    onDeletePoll: vi.fn(),
    onEditPoll: vi.fn(),
    onLogin: vi.fn(),
  };

  it("affiche le titre, auteur, fin, état et ferme au clic sur Fermer ou fond", () => {
    const onClose = vi.fn();

    render(<PollVoteModal {...defaultProps} onClose={onClose} />);

    expect(
      screen.getByRole("heading", { name: "Modal Poll" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Par Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Fin :/)).toBeInTheDocument();
    expect(screen.getByText(/Ouvert/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Fermer la fenêtre/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ne ferme pas quand on clique dans le dialog", () => {
    const onClose = vi.fn();

    render(<PollVoteModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("affiche la description quand non vide", () => {
    render(<PollVoteModal {...defaultProps} />);
    expect(screen.getByText("Desc")).toBeInTheDocument();
  });

  it("n'affiche pas la description quand elle est null", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, description: null }}
      />,
    );

    expect(screen.queryByText("Desc")).not.toBeInTheDocument();
  });

  it("n'affiche pas la description quand elle est vide", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, description: "" }}
      />,
    );

    expect(screen.queryByText("Desc")).not.toBeInTheDocument();
  });

  it("ne rend pas la description si elle est vide après trim", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, description: "   ", canManage: false }}
      />,
    );

    expect(screen.queryByText("   ")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /modifier le sondage/i }),
    ).not.toBeInTheDocument();
  });

  it("transmet les props attendues au formulaire de vote", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        session={{
          userID: 1,
          nickname: "Bob",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        selectedOptionIDs={[2]}
        actionLoading
      />,
    );

    expect(screen.getByText("voteform:1")).toBeInTheDocument();
    expect(screen.getByText("selected:2")).toBeInTheDocument();
    expect(screen.getByText("loading:true")).toBeInTheDocument();
    expect(screen.getByText("session:yes")).toBeInTheDocument();
  });

  it("relaie les callbacks du formulaire de vote", () => {
    const onToggleOption = vi.fn();
    const onSubmitVote = vi.fn();
    const onDeleteVote = vi.fn();
    const onLogin = vi.fn();

    render(
      <PollVoteModal
        {...defaultProps}
        onToggleOption={onToggleOption}
        onSubmitVote={onSubmitVote}
        onDeleteVote={onDeleteVote}
        onLogin={onLogin}
        actionLoading
      />,
    );

    fireEvent.click(screen.getByText("toggle-option"));
    fireEvent.click(screen.getByText("submit-vote"));
    fireEvent.click(screen.getByText("delete-vote"));
    fireEvent.click(screen.getByText("login"));

    expect(onToggleOption).toHaveBeenCalledWith(1);
    expect(onSubmitVote).toHaveBeenCalled();
    expect(onDeleteVote).toHaveBeenCalled();
    expect(onLogin).toHaveBeenCalled();
  });

  it("affiche la section admin quand canManage est true", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, canManage: true }}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Modifier le sondage/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    ).toBeInTheDocument();
  });

  it("n'affiche pas la section admin quand canManage est false", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, canManage: false }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Modifier le sondage/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Supprimer le sondage/i }),
    ).not.toBeInTheDocument();
  });

  it("appelle onEditPoll quand on clique sur Modifier le sondage", () => {
    const onEditPoll = vi.fn();

    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, canManage: true }}
        onEditPoll={onEditPoll}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Modifier le sondage/i }),
    );

    expect(onEditPoll).toHaveBeenCalledWith(1);
  });

  it("appelle onDeletePoll quand on clique sur Supprimer le sondage", () => {
    const onDeletePoll = vi.fn();

    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, canManage: true }}
        onDeletePoll={onDeletePoll}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );

    expect(onDeletePoll).toHaveBeenCalled();
  });

  it("affiche les résultats", () => {
    render(<PollVoteModal {...defaultProps} />);
    expect(screen.getByText("results:1")).toBeInTheDocument();
  });

  it("affiche le formulaire de vote", () => {
    render(<PollVoteModal {...defaultProps} />);
    expect(screen.getByText("voteform:1")).toBeInTheDocument();
  });

  it("affiche la date brute si endAt est invalide", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, endAt: "not-a-date" }}
      />,
    );

    expect(screen.getByText(/not-a-date/)).toBeInTheDocument();
  });

  it("affiche l'état fermé quand le sondage est clos", () => {
    render(
      <PollVoteModal
        {...defaultProps}
        poll={{ ...basePoll, isClosed: true }}
      />,
    );

    expect(screen.getByText(/Fermé/)).toBeInTheDocument();
  });
});
