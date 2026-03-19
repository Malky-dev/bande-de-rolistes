import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PollVoteForm from "@/client/components/polls/PollVoteForm";
import { makePoll } from "../../../../../fixtures/polls";
import { makeMemberSession } from "../../../../../fixtures/session";

describe("PollVoteForm", () => {
  it("affiche un message et le bouton Se connecter quand la session est nulle", () => {
    const onLogin = vi.fn();

    render(
      <PollVoteForm
        session={null}
        poll={makePoll()}
        selectedOptionIDs={[]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={onLogin}
      />,
    );

    expect(
      screen.getByText(/Connecte-toi pour participer/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));
    expect(onLogin).toHaveBeenCalled();
  });

  it("affiche un message quand le vote n'est pas disponible", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ canVote: false })}
        selectedOptionIDs={[]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        (content) =>
          content.includes("Le vote") && content.includes("pas disponible"),
      ),
    ).toBeInTheDocument();
  });

  it("affiche des radios quand maxSelections vaut 1 et appelle onToggleOption", () => {
    const onToggleOption = vi.fn();

    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll()}
        selectedOptionIDs={[]}
        onToggleOption={onToggleOption}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Les Tontons flingueurs")).toHaveAttribute(
      "type",
      "radio",
    );
    expect(screen.getByLabelText("Un singe en hiver")).toHaveAttribute(
      "type",
      "radio",
    );

    fireEvent.click(screen.getByLabelText("Les Tontons flingueurs"));
    expect(onToggleOption).toHaveBeenCalledWith(1);
  });

  it("affiche des checkboxes quand maxSelections est supérieur à 1", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ maxSelections: 2 })}
        selectedOptionIDs={[]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Les Tontons flingueurs")).toHaveAttribute(
      "type",
      "checkbox",
    );
    expect(screen.getByLabelText("Un singe en hiver")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });

  it("affiche les options cochées selon selectedOptionIDs", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ maxSelections: 2 })}
        selectedOptionIDs={[2]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Les Tontons flingueurs")).not.toBeChecked();
    expect(screen.getByLabelText("Un singe en hiver")).toBeChecked();
  });

  it("appelle Enregistrer mon vote et Supprimer mon vote", () => {
    const onSubmitVote = vi.fn();
    const onDeleteVote = vi.fn();

    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ myVote: [1] })}
        selectedOptionIDs={[1]}
        onToggleOption={vi.fn()}
        onSubmitVote={onSubmitVote}
        onDeleteVote={onDeleteVote}
        onLogin={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    );
    expect(onSubmitVote).toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    );
    expect(onDeleteVote).toHaveBeenCalled();
  });

  it("désactive Enregistrer sans sélection et Supprimer sans vote existant", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll()}
        selectedOptionIDs={[]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    ).toBeDisabled();
  });

  it("active Enregistrer quand une option est sélectionnée même sans vote existant", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll()}
        selectedOptionIDs={[1]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    ).toBeDisabled();
  });

  it("active Supprimer quand un vote existe déjà", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ myVote: [2] })}
        selectedOptionIDs={[2]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    ).not.toBeDisabled();
  });

  it("désactive toutes les options et tous les boutons pendant le chargement", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({ myVote: [1] })}
        selectedOptionIDs={[1]}
        loading
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Les Tontons flingueurs")).toBeDisabled();
    expect(screen.getByLabelText("Un singe en hiver")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    ).toBeDisabled();
  });

  it("désactive une option non cochée quand la limite multi-choix est atteinte", () => {
    render(
      <PollVoteForm
        session={makeMemberSession()}
        poll={makePoll({
          maxSelections: 2,
          options: [
            {
              optionID: 1,
              label: "Spock",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 2,
              label: "Leia Organa",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 3,
              label: "Ripley",
              displayOrder: 2,
              voteCount: 0,
              voters: [],
            },
          ],
        })}
        selectedOptionIDs={[1, 2]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Spock")).not.toBeDisabled();
    expect(screen.getByLabelText("Leia Organa")).not.toBeDisabled();
    expect(screen.getByLabelText("Ripley")).toBeDisabled();
  });

  it("trie les options par optionID quand displayOrder est identique", () => {
    render(
      <PollVoteForm
        session={makeMemberSession({ nickname: "Bob" })}
        poll={makePoll({
          maxSelections: 2,
          options: [
            {
              optionID: 9,
              label: "Troisième visuellement",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 3,
              label: "Premier visuellement",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
          ],
        })}
        selectedOptionIDs={[]}
        onToggleOption={vi.fn()}
        onSubmitVote={vi.fn()}
        onDeleteVote={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    const labels = screen
      .getAllByText(/visuellement/)
      .map((node) => node.textContent);

    expect(labels).toEqual(["Premier visuellement", "Troisième visuellement"]);
  });
});
