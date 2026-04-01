import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function makeListItem(overrides: Partial<PollListItem> = {}): PollListItem {
  return {
    pollID: 1,
    title: "Quel est le meilleur Audiard ?",
    description: "Les Tontons flingueurs, Les Barbouzes ou Un singe en hiver ?",
    endAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    createdBy: { userID: 10, nickname: "Patricia" },
    maxSelections: 1,
    totalVoters: 0,
    totalVotes: 0,
    isClosed: false,
    canManage: false,
    ...overrides,
  };
}

function makeDetails(overrides: Partial<PollDetails> = {}): PollDetails {
  return {
    pollID: 1,
    title: "Quel est le meilleur Audiard ?",
    description: "Les Tontons flingueurs, Les Barbouzes ou Un singe en hiver ?",
    endAt: "2026-06-01T12:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdBy: { userID: 10, nickname: "Patricia" },
    maxSelections: 1,
    isClosed: false,
    canVote: true,
    canManage: false,
    myVote: [],
    options: [
      {
        optionID: 1,
        label: "Les Tontons flingueurs",
        displayOrder: 0,
        voteCount: 0,
        voters: [],
      },
      {
        optionID: 2,
        label: "Un singe en hiver",
        displayOrder: 1,
        voteCount: 0,
        voters: [],
      },
    ],
    ...overrides,
  };
}

async function openPoll(title: string): Promise<void> {
  await waitFor(() => {
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText(title));

  await waitFor(() => {
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("PollsView", () => {
  it("affiche le titre et le sous-titre", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    expect(screen.getByText("Sondages")).toBeInTheDocument();
    expect(
      screen.getByText(/Consultation publique, vote authentifié/i),
    ).toBeInTheDocument();
  });

  it("n'affiche pas 'Créer un sondage' quand la session est nulle", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("button", { name: /Créer un sondage/i }),
    ).not.toBeInTheDocument();
  });

  it("affiche 'Créer un sondage' pour un admin et appelle onCreatePoll", async () => {
    const onCreatePoll = vi.fn();

    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Créer un sondage/i }));

    expect(onCreatePoll).toHaveBeenCalled();
  });

  it("affiche 'Créer un sondage' pour le rôle 2 et appelle onCreatePoll", async () => {
    const onCreatePoll = vi.fn();

    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Paul",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={onCreatePoll}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Créer un sondage/i }));

    expect(onCreatePoll).toHaveBeenCalled();
  });

  it("n'affiche pas le bouton de création pour un utilisateur connecté non autorisé", async () => {
    vi.mocked(apiListPolls).mockResolvedValue([]);

    render(
      <PollsView
        session={{
          userID: 9,
          nickname: "Paul",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(apiListPolls).toHaveBeenCalled();
    });

    expect(
      screen.queryByRole("button", { name: /Créer un sondage/i }),
    ).not.toBeInTheDocument();
  });

  it("affiche la liste des sondages et ouvre le modal au clic", async () => {
    const listItem = makeListItem({
      title: "Quel sabre laser choisir sur Mustafar ?",
      description: "Rouge, bleu ou double lame ?",
    });
    const details = makeDetails({
      title: listItem.title,
      description: listItem.description,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Quel sabre laser choisir sur Mustafar ?");

    expect(apiGetPoll).toHaveBeenCalledWith(listItem.pollID);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("affiche le message d'erreur quand apiListPolls échoue", async () => {
    vi.mocked(apiListPolls).mockRejectedValue(new Error("Hyperdrive en panne"));

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Hyperdrive en panne")).toBeInTheDocument();
    });
  });

  it("affiche le message fallback quand apiListPolls rejette avec une valeur non Error", async () => {
    vi.mocked(apiListPolls).mockRejectedValue("boom");

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger les sondages."),
      ).toBeInTheDocument();
    });
  });

  it("soumet le vote et rafraîchit la vue", async () => {
    const listItem = makeListItem({
      title: "Qui emmène le Faucon Millenium au casse-pipe ?",
    });
    const details = makeDetails({
      title: listItem.title,
      options: [
        {
          optionID: 1,
          label: "Han Solo",
          displayOrder: 0,
          voteCount: 0,
          voters: [],
        },
        {
          optionID: 2,
          label: "Chewbacca",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls)
      .mockResolvedValueOnce([listItem])
      .mockResolvedValueOnce([listItem]);

    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiReplacePollVote).mockResolvedValue("Vote enregistré.");

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Luke",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui emmène le Faucon Millenium au casse-pipe ?");

    fireEvent.click(screen.getByLabelText("Han Solo"));
    fireEvent.click(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    );

    await waitFor(() => {
      expect(apiReplacePollVote).toHaveBeenCalledWith(listItem.pollID, {
        optionIDs: [1],
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Vote enregistré.")).toBeInTheDocument();
    });
  });

  it("affiche une erreur quand l'enregistrement du vote échoue", async () => {
    const listItem = makeListItem({
      title: "Qui doit piloter le Normandy ?",
    });

    const details = makeDetails({
      title: listItem.title,
      options: [
        {
          optionID: 1,
          label: "Shepard",
          displayOrder: 0,
          voteCount: 0,
          voters: [],
        },
        {
          optionID: 2,
          label: "Joker",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiReplacePollVote).mockRejectedValue(
      new Error("Le relais cosmodésique a sauté."),
    );

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Garrus",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui doit piloter le Normandy ?");

    fireEvent.click(screen.getByLabelText("Shepard"));
    fireEvent.click(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    );

    expect(
      await screen.findByText("Le relais cosmodésique a sauté."),
    ).toBeInTheDocument();
  });

  it("affiche le message fallback quand l'enregistrement du vote échoue avec une valeur non Error", async () => {
    const listItem = makeListItem({
      title: "Qui prend le volant ?",
    });

    const details = makeDetails({
      title: listItem.title,
      options: [
        {
          optionID: 1,
          label: "Fernand",
          displayOrder: 0,
          voteCount: 0,
          voters: [],
        },
        {
          optionID: 2,
          label: "Raoul",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiReplacePollVote).mockRejectedValue({});

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Fernand",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui prend le volant ?");

    fireEvent.click(screen.getByLabelText("Fernand"));
    fireEvent.click(
      screen.getByRole("button", { name: /Enregistrer mon vote/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible d'enregistrer le vote."),
      ).toBeInTheDocument();
    });
  });

  it("réactive le bouton d'enregistrement quand l'enregistrement du vote échoue", async () => {
    const listItem = makeListItem({
      title: "Qui prend le volant ?",
    });

    const details = makeDetails({
      title: listItem.title,
      options: [
        {
          optionID: 1,
          label: "Fernand",
          displayOrder: 0,
          voteCount: 0,
          voters: [],
        },
        {
          optionID: 2,
          label: "Raoul",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiReplacePollVote).mockRejectedValue("boom");

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Fernand",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui prend le volant ?");

    fireEvent.click(screen.getByLabelText("Fernand"));

    const saveButton = screen.getByRole("button", {
      name: /Enregistrer mon vote/i,
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Impossible d'enregistrer le vote."),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it("supprime le vote au clic sur 'Supprimer mon vote'", async () => {
    const listItem = makeListItem({
      title: "Faut-il confier la mission à Ellen Ripley ?",
    });
    const details = makeDetails({
      title: listItem.title,
      myVote: [1],
      options: [
        {
          optionID: 1,
          label: "Oui, évidemment",
          displayOrder: 0,
          voteCount: 1,
          voters: [],
        },
        {
          optionID: 2,
          label: "Non, envoyons Burke",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePollVote).mockResolvedValue("Vote supprimé.");

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "RipleyFan",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il confier la mission à Ellen Ripley ?");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    );

    await waitFor(() => {
      expect(apiDeletePollVote).toHaveBeenCalledWith(listItem.pollID);
    });
  });

  it("affiche le message fallback quand la suppression du vote échoue avec une valeur non Error", async () => {
    const listItem = makeListItem({
      title: "Faut-il envoyer Deckard sur l'affaire ?",
    });
    const details = makeDetails({
      title: listItem.title,
      myVote: [1],
      options: [
        {
          optionID: 1,
          label: "Oui",
          displayOrder: 0,
          voteCount: 1,
          voters: [],
        },
        {
          optionID: 2,
          label: "Non",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePollVote).mockRejectedValue("boom");

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Deckard",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il envoyer Deckard sur l'affaire ?");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer mon vote/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de supprimer le vote."),
      ).toBeInTheDocument();
    });
  });

  it("réactive le bouton de suppression du vote quand la suppression échoue", async () => {
    const listItem = makeListItem({
      title: "Faut-il envoyer Deckard sur l'affaire ?",
    });

    const details = makeDetails({
      title: listItem.title,
      myVote: [1],
      options: [
        {
          optionID: 1,
          label: "Oui",
          displayOrder: 0,
          voteCount: 1,
          voters: [],
        },
        {
          optionID: 2,
          label: "Non",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePollVote).mockRejectedValue("boom");

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Deckard",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il envoyer Deckard sur l'affaire ?");

    const deleteVoteButton = screen.getByRole("button", {
      name: /Supprimer mon vote/i,
    });

    fireEvent.click(deleteVoteButton);

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de supprimer le vote."),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(deleteVoteButton).not.toBeDisabled();
    });
  });

  it("supprime le sondage après confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const listItem = makeListItem({
      title: "Faut-il revoir Les Barbouzes ?",
      canManage: true,
    });
    const details = makeDetails({
      title: listItem.title,
      canManage: true,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePoll).mockResolvedValue("Sondage supprimé.");

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il revoir Les Barbouzes ?");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );

    await waitFor(() => {
      expect(apiDeletePoll).toHaveBeenCalledWith(listItem.pollID);
    });
  });

  it("ne supprime pas le sondage si la confirmation est refusée", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    const listItem = makeListItem({
      title: "Les Barbouzes méritent-ils une ressortie ?",
      canManage: true,
    });
    const details = makeDetails({
      title: listItem.title,
      canManage: true,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Les Barbouzes méritent-ils une ressortie ?");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );

    expect(globalThis.confirm).toHaveBeenCalled();
    expect(apiDeletePoll).not.toHaveBeenCalled();
  });

  it("affiche le message fallback quand la suppression du sondage échoue avec une valeur non Error", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const listItem = makeListItem({
      title: "Faut-il dynamiter la planque ?",
      canManage: true,
    });
    const details = makeDetails({
      title: listItem.title,
      canManage: true,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePoll).mockRejectedValue("boom");

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il dynamiter la planque ?");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de supprimer le sondage."),
      ).toBeInTheDocument();
    });
  });

  it("réactive le bouton de suppression du sondage quand la suppression échoue", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    const listItem = makeListItem({
      title: "Faut-il dynamiter la planque ?",
      canManage: true,
    });

    const details = makeDetails({
      title: listItem.title,
      canManage: true,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);
    vi.mocked(apiDeletePoll).mockRejectedValue("boom");

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Faut-il dynamiter la planque ?");

    const deletePollButton = screen.getByRole("button", {
      name: /Supprimer le sondage/i,
    });

    fireEvent.click(deletePollButton);

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de supprimer le sondage."),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(deletePollButton).not.toBeDisabled();
    });
  });

  it("n'affiche pas les contrôles de vote quand le vote est interdit", async () => {
    const listItem = makeListItem({
      title: "Qui pilote le Faucon Millenium ?",
    });

    const details = makeDetails({
      title: listItem.title,
      canVote: false,
      options: [
        {
          optionID: 1,
          label: "Han Solo",
          displayOrder: 0,
          voteCount: 3,
          voters: [],
        },
        {
          optionID: 2,
          label: "Lando Calrissian",
          displayOrder: 1,
          voteCount: 1,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Luke",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui pilote le Faucon Millenium ?");

    expect(
      screen.getByText(/Le vote n’est pas disponible pour ce sondage\./i),
    ).toBeInTheDocument();

    expect(screen.queryByLabelText("Han Solo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Lando Calrissian")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enregistrer mon vote/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Supprimer mon vote/i }),
    ).not.toBeInTheDocument();
  });

  it("remplace la sélection précédente en choix unique", async () => {
    const listItem = makeListItem({
      title: "Qui mène la danse chez Audiard ?",
    });

    const details = makeDetails({
      title: listItem.title,
      maxSelections: 1,
      options: [
        {
          optionID: 1,
          label: "Les Tontons flingueurs",
          displayOrder: 0,
          voteCount: 0,
          voters: [],
        },
        {
          optionID: 2,
          label: "Un singe en hiver",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Fernand",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Qui mène la danse chez Audiard ?");

    const tontons = screen.getByLabelText(
      "Les Tontons flingueurs",
    ) as HTMLInputElement;
    const singe = screen.getByLabelText(
      "Un singe en hiver",
    ) as HTMLInputElement;

    fireEvent.click(tontons);
    expect(tontons.checked).toBe(true);
    expect(singe.checked).toBe(false);

    fireEvent.click(singe);
    expect(tontons.checked).toBe(false);
    expect(singe.checked).toBe(true);
  });

  it("refuse un troisième choix quand la limite multi-sélection est atteinte", async () => {
    const listItem = makeListItem({
      title: "Quel équipage pour sauver la galaxie ?",
      maxSelections: 2,
    });
    const details = makeDetails({
      title: listItem.title,
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
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Luke",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Quel équipage pour sauver la galaxie ?");

    const spock = screen.getByLabelText("Spock") as HTMLInputElement;
    const leia = screen.getByLabelText("Leia Organa") as HTMLInputElement;
    const ripley = screen.getByLabelText("Ripley") as HTMLInputElement;

    fireEvent.click(spock);
    fireEvent.click(leia);
    fireEvent.click(ripley);

    expect(spock.checked).toBe(true);
    expect(leia.checked).toBe(true);
    expect(ripley.checked).toBe(false);
  });

  it("retire une option déjà cochée en multi-sélection quand on reclique dessus", async () => {
    const listItem = makeListItem({
      title: "Quel équipage ?",
      maxSelections: 2,
    });

    const details = makeDetails({
      title: listItem.title,
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
          label: "Leia",
          displayOrder: 1,
          voteCount: 0,
          voters: [],
        },
      ],
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={{
          userID: 2,
          nickname: "Kirk",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Quel équipage ?");

    const spock = screen.getByLabelText("Spock") as HTMLInputElement;

    fireEvent.click(spock);
    expect(spock.checked).toBe(true);

    fireEvent.click(spock);
    expect(spock.checked).toBe(false);
  });

  it("affiche le message fallback quand le chargement du détail échoue avec une valeur non Error", async () => {
    const listItem = makeListItem({
      title: "Qui prend la relève ?",
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockRejectedValue("boom");

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Qui prend la relève ?")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Qui prend la relève ?"));

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger le détail du sondage."),
      ).toBeInTheDocument();
    });
  });

  it("appelle onLogin quand la session est nulle et que l'utilisateur clique sur Se connecter", async () => {
    const onLogin = vi.fn();
    const listItem = makeListItem({
      title: "Qui vote ?",
    });
    const details = makeDetails({
      title: listItem.title,
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockResolvedValue(details);

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={onLogin}
      />,
    );

    await openPoll("Qui vote ?");

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));

    expect(onLogin).toHaveBeenCalled();
  });

  it("ferme le modal quand on clique sur le fond pendant le chargement du détail", async () => {
    const listItem = makeListItem({
      title: "Sondage très lent",
    });

    vi.mocked(apiListPolls).mockResolvedValue([listItem]);
    vi.mocked(apiGetPoll).mockImplementation(
      () =>
        new Promise(() => {
          // attente volontaire
        }),
    );

    render(
      <PollsView
        session={null}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Sondage très lent")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Sondage très lent"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Chargement du sondage…");

    fireEvent.click(dialog.parentElement!);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("re-sélectionne automatiquement le premier sondage restant quand le courant disparaît après refresh", async () => {
    const firstPoll = makeListItem({
      pollID: 1,
      title: "Les Tontons flingueurs",
      description: "Le premier sondage",
      canManage: true,
    });

    const secondPoll = makeListItem({
      pollID: 2,
      title: "Blade Runner",
      description: "Le second sondage",
    });

    vi.mocked(apiListPolls)
      .mockResolvedValueOnce([firstPoll, secondPoll])
      .mockResolvedValueOnce([secondPoll]);

    vi.mocked(apiGetPoll)
      .mockResolvedValueOnce(
        makeDetails({
          pollID: 1,
          title: "Les Tontons flingueurs",
          description: "Le premier sondage",
          canManage: true,
        }),
      )
      .mockResolvedValueOnce(
        makeDetails({
          pollID: 2,
          title: "Blade Runner",
          description: "Le second sondage",
        }),
      );

    vi.mocked(apiDeletePoll).mockResolvedValue("Sondage supprimé.");
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    render(
      <PollsView
        session={{
          userID: 1,
          nickname: "Raoul",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onCreatePoll={vi.fn()}
        onEditPoll={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await openPoll("Les Tontons flingueurs");

    fireEvent.click(
      screen.getByRole("button", { name: /Supprimer le sondage/i }),
    );

    await waitFor(() => {
      expect(apiDeletePoll).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(apiGetPoll).toHaveBeenCalledWith(2);
    });
  });
});
