import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PollDetailsPanel from "@/client/components/polls/PollDetailsPanel";
import { makePoll } from "../../../../../fixtures/polls";

describe("PollDetailsPanel", () => {
  const defaultProps = {
    session: null,
    poll: makePoll({
      title: "Test Poll",
      description: "Description",
      createdBy: { userID: 10, nickname: "Alice" },
    }),
    selectedOptionIDs: [] as number[],
    onToggleOption: vi.fn(),
    onSubmitVote: vi.fn(),
    onDeleteVote: vi.fn(),
    onDeletePoll: vi.fn(),
    onEditPoll: vi.fn(),
    onLogin: vi.fn(),
    onOptionsChanged: vi.fn(),
  };

  it("affiche le titre, auteur, fin, état et maxSelections", () => {
    render(<PollDetailsPanel {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Test Poll" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Créé par Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Fin :/)).toBeInTheDocument();
    expect(screen.getByText(/État : Ouvert/)).toBeInTheDocument();
    expect(
      screen.getByText(/Nombre maximum de sélections : 1/),
    ).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("affiche la valeur brute de endAt quand la date est invalide", () => {
    render(
      <PollDetailsPanel
        {...defaultProps}
        poll={makePoll({
          title: "Test Poll",
          description: "Description",
          createdBy: { userID: 10, nickname: "Alice" },
          endAt: "date-invalide",
        })}
      />,
    );

    expect(screen.getByText(/date-invalide/)).toBeInTheDocument();
  });

  it("n'affiche pas la section Administration quand canManage est false", () => {
    render(<PollDetailsPanel {...defaultProps} />);

    expect(
      screen.queryByRole("heading", { name: "Administration" }),
    ).not.toBeInTheDocument();
  });

  it("affiche la section Administration avec Modifier/Supprimer quand canManage est true", () => {
    const onEditPoll = vi.fn();
    const onDeletePoll = vi.fn();

    render(
      <PollDetailsPanel
        {...defaultProps}
        poll={makePoll({
          title: "Test Poll",
          description: "Description",
          createdBy: { userID: 10, nickname: "Alice" },
          canManage: true,
        })}
        onEditPoll={onEditPoll}
        onDeletePoll={onDeletePoll}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Administration" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Modifier le sondage/i }),
    );
    expect(onEditPoll).toHaveBeenCalledWith(1);

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );
    expect(onDeletePoll).toHaveBeenCalled();
  });

  it("n'affiche pas la description quand elle est null", () => {
    render(
      <PollDetailsPanel
        {...defaultProps}
        poll={makePoll({
          title: "Test Poll",
          description: null,
          createdBy: { userID: 10, nickname: "Alice" },
        })}
      />,
    );

    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("n'affiche pas la description quand elle est null et masque l'administration si canManage est false", () => {
    render(
      <PollDetailsPanel
        {...defaultProps}
        poll={makePoll({
          title: "Test Poll",
          description: null,
          createdBy: { userID: 10, nickname: "Alice" },
          canManage: false,
        })}
      />,
    );

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Description")).not.toBeInTheDocument();
  });

  it("affiche l'état fermé quand le sondage est clos", () => {
    render(
      <PollDetailsPanel
        {...defaultProps}
        poll={makePoll({
          title: "Test Poll",
          createdBy: { userID: 10, nickname: "Alice" },
          isClosed: true,
        })}
      />,
    );

    expect(screen.getByText(/État : Fermé/)).toBeInTheDocument();
  });
});
