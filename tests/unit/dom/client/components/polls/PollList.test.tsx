import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PollList from "@/client/components/polls/PollList";
import type { PollListItem } from "@/types/api/polls";

const mockPolls: PollListItem[] = [
  {
    pollID: 1,
    title: "Poll A",
    description: "Description A",
    endAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: { userID: 10, nickname: "Alice" },
    maxSelections: 1,
    totalVoters: 5,
    totalVotes: 5,
    isClosed: false,
    canManage: false,
  },
  {
    pollID: 2,
    title: "Poll B",
    description: null,
    endAt: "2026-07-01T12:00:00.000Z",
    createdAt: "2026-02-01T00:00:00.000Z",
    createdBy: { userID: 11, nickname: "Bob" },
    maxSelections: 1,
    totalVoters: 0,
    totalVotes: 0,
    isClosed: true,
    canManage: false,
  },
];

describe("PollList", () => {
  it("affiche le message de chargement quand loading est true", () => {
    render(
      <PollList polls={[]} selectedPollID={null} loading onSelect={vi.fn()} />,
    );
    expect(screen.getByText(/Chargement des sondages/i)).toBeInTheDocument();
  });

  it("affiche aucun sondage disponible quand la liste est vide", () => {
    render(
      <PollList
        polls={[]}
        selectedPollID={null}
        loading={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText(/Aucun sondage disponible/i)).toBeInTheDocument();
  });

  it("affiche les cartes des sondages avec titre, statut et auteur", () => {
    render(
      <PollList polls={mockPolls} selectedPollID={null} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Poll A")).toBeInTheDocument();
    expect(screen.getByText("Poll B")).toBeInTheDocument();
    expect(screen.getByText("Ouvert")).toBeInTheDocument();
    expect(screen.getByText("Fermé")).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("affiche Aucune description quand description est null ou vide", () => {
    render(
      <PollList
        polls={[mockPolls[1]]}
        selectedPollID={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Aucune description.")).toBeInTheDocument();
  });

  it("appelle onSelect avec pollID au clic sur une carte", () => {
    const onSelect = vi.fn();
    render(
      <PollList polls={mockPolls} selectedPollID={null} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText("Poll A"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("affiche le bouton Modifier quand canManagePolls et onEdit sont fournis", () => {
    const onEdit = vi.fn();
    render(
      <PollList
        polls={mockPolls}
        selectedPollID={null}
        onSelect={vi.fn()}
        onEdit={onEdit}
        canManagePolls
      />,
    );
    const editButtons = screen.getAllByRole("button", { name: /Modifier/i });
    expect(editButtons).toHaveLength(2);
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it("tronque la description à 120 caractères", () => {
    const longDesc = "a".repeat(150);
    render(
      <PollList
        polls={[
          {
            ...mockPolls[0],
            description: longDesc,
          },
        ]}
        selectedPollID={null}
        onSelect={vi.fn()}
      />,
    );
    const descEl = screen.getByText(/a{120}…/);
    expect(descEl).toBeInTheDocument();
  });
});
