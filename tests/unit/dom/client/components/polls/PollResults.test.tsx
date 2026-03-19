import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PollResults from "@/client/components/polls/PollResults";
import type { PollDetails } from "@/types/api/polls";

function makePoll(overrides: Partial<PollDetails> = {}): PollDetails {
  return {
    pollID: 1,
    title: "Quel film d'Audiard remet-on à l'affiche ?",
    description: null,
    endAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: { userID: 10, nickname: "Patricia" },
    maxSelections: 1,
    isClosed: false,
    canVote: true,
    canManage: false,
    myVote: [],
    options: [],
    ...overrides,
  };
}

describe("PollResults", () => {
  it("affiche le titre Résultats", () => {
    render(<PollResults poll={makePoll()} />);

    expect(
      screen.getByRole("heading", { name: "Résultats" }),
    ).toBeInTheDocument();
  });

  it("affiche '0 vote.' pour une option sans votant", () => {
    render(
      <PollResults
        poll={makePoll({
          options: [
            {
              optionID: 1,
              label: "Les Barbouzes",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Les Barbouzes")).toBeInTheDocument();
    expect(screen.getByText("0 vote.")).toBeInTheDocument();
  });

  it("affiche '1 vote.' et le nom du votant pour une option avec un seul vote", () => {
    render(
      <PollResults
        poll={makePoll({
          options: [
            {
              optionID: 1,
              label: "Un singe en hiver",
              displayOrder: 0,
              voteCount: 1,
              voters: [{ userID: 1, nickname: "Fernand" }],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Un singe en hiver")).toBeInTheDocument();
    expect(screen.getByText("1 vote.")).toBeInTheDocument();
    expect(screen.getByText("Fernand")).toBeInTheDocument();
  });

  it("affiche 'N votes.' et la liste des votants pour une option avec plusieurs votes", () => {
    render(
      <PollResults
        poll={makePoll({
          options: [
            {
              optionID: 1,
              label: "Blade Runner",
              displayOrder: 0,
              voteCount: 3,
              voters: [
                { userID: 1, nickname: "Deckard" },
                { userID: 2, nickname: "Roy" },
                { userID: 3, nickname: "Rachael" },
              ],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Blade Runner")).toBeInTheDocument();
    expect(screen.getByText("3 votes.")).toBeInTheDocument();
    expect(screen.getByText("Deckard")).toBeInTheDocument();
    expect(screen.getByText("Roy")).toBeInTheDocument();
    expect(screen.getByText("Rachael")).toBeInTheDocument();
  });

  it("affiche plusieurs options avec leurs états respectifs", () => {
    render(
      <PollResults
        poll={makePoll({
          options: [
            {
              optionID: 1,
              label: "Les Tontons flingueurs",
              displayOrder: 0,
              voteCount: 2,
              voters: [
                { userID: 1, nickname: "Raoul" },
                { userID: 2, nickname: "Patricia" },
              ],
            },
            {
              optionID: 2,
              label: "Le Grand Blond",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 3,
              label: "Alien",
              displayOrder: 2,
              voteCount: 1,
              voters: [{ userID: 3, nickname: "Ripley" }],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Les Tontons flingueurs")).toBeInTheDocument();
    expect(screen.getByText("2 votes.")).toBeInTheDocument();
    expect(screen.getByText("Raoul")).toBeInTheDocument();
    expect(screen.getByText("Patricia")).toBeInTheDocument();

    expect(screen.getByText("Le Grand Blond")).toBeInTheDocument();
    expect(screen.getByText("0 vote.")).toBeInTheDocument();

    expect(screen.getByText("Alien")).toBeInTheDocument();
    expect(screen.getByText("1 vote.")).toBeInTheDocument();
    expect(screen.getByText("Ripley")).toBeInTheDocument();
  });

  it("trie les options par displayOrder puis optionID", () => {
    render(
      <PollResults
        poll={makePoll({
          options: [
            {
              optionID: 30,
              label: "Zulu",
              displayOrder: 2,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 11,
              label: "Bravo",
              displayOrder: 0,
              voteCount: 1,
              voters: [{ userID: 99, nickname: "Zed" }],
            },
            {
              optionID: 10,
              label: "Alpha",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
          ],
        })}
      />,
    );

    const text = document.body.textContent ?? "";
    expect(text.indexOf("Alpha")).toBeLessThan(text.indexOf("Bravo"));
    expect(text.indexOf("Bravo")).toBeLessThan(text.indexOf("Zulu"));
  });
});
