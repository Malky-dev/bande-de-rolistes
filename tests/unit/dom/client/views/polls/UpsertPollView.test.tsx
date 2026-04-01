import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

import {
  apiCreatePoll,
  apiCreatePollOption,
  apiDeletePollOption,
  apiGetPoll,
  apiUpdatePoll,
  apiUpdatePollOption,
} from "@/api/polls";
import type { PollDetails } from "@/types/api/polls";
import type { SessionInfo } from "@/types/api/session";
import UpsertPollView from "@/client/views/polls/UpsertPollView";

vi.mock("@/api/polls", () => ({
  apiCreatePoll: vi.fn(),
  apiGetPoll: vi.fn(),
  apiUpdatePoll: vi.fn(),
  apiCreatePollOption: vi.fn(),
  apiUpdatePollOption: vi.fn(),
  apiDeletePollOption: vi.fn(),
}));

vi.mock("react-datepicker", () => {
  const React = require("react");
  return {
    default: function MockDatePicker({
      selected,
      onChange,
      placeholderText,
    }: {
      selected: Date | null;
      onChange: (d: Date | null) => void;
      placeholderText?: string;
    }): ReactElement {
      return React.createElement("input", {
        "data-testid": "datepicker",
        value: selected ? selected.toISOString().slice(0, 16) : "",
        onChange: (e: { target: { value: string } }) => {
          const v = e.target.value;
          if (v) onChange(new Date(v));
          else onChange(null);
        },
        placeholder: placeholderText,
      });
    },
  };
});

const adminSession: SessionInfo = {
  userID: 1,
  nickname: "Admin",
  roleID: 1,
  role: "admin",
  isVerified: true,
};

const memberSession: SessionInfo = {
  userID: 1,
  nickname: "U",
  roleID: 5,
  role: "member",
  isVerified: true,
};

const mockPoll: PollDetails = {
  pollID: 1,
  title: "Existing Poll",
  description: "Desc",
  endAt: "2026-06-01T12:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: { userID: 10, nickname: "Alice" },
  maxSelections: 1,
  isClosed: false,
  canVote: true,
  canManage: true,
  myVote: [],
  options: [
    { optionID: 1, label: "A", displayOrder: 0, voteCount: 0, voters: [] },
    { optionID: 2, label: "B", displayOrder: 1, voteCount: 0, voters: [] },
  ],
};

const mockPollWith3Options: PollDetails = {
  ...mockPoll,
  options: [
    { optionID: 1, label: "A", displayOrder: 0, voteCount: 0, voters: [] },
    { optionID: 2, label: "B", displayOrder: 1, voteCount: 0, voters: [] },
    { optionID: 3, label: "C", displayOrder: 2, voteCount: 0, voters: [] },
  ],
};

describe("UpsertPollView", () => {
  const onBack = vi.fn();
  const onDone = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderView(
    props: Partial<React.ComponentProps<typeof UpsertPollView>> = {},
  ) {
    return render(
      <UpsertPollView
        session={adminSession}
        onBack={onBack}
        onDone={onDone}
        {...props}
      />,
    );
  }

  function getOptionInputs(): HTMLInputElement[] {
    return screen
      .getAllByRole("textbox")
      .filter((el) =>
        (el.getAttribute("id") ?? "").includes("poll-option"),
      ) as HTMLInputElement[];
  }

  function fillCreateForm({
    title = "New Poll",
    description,
    endAt = "2026-06-02T12:00",
    options = ["Opt 1", "Opt 2"],
  }: {
    title?: string;
    description?: string;
    endAt?: string;
    options?: string[];
  } = {}) {
    fireEvent.change(screen.getByLabelText(/Titre/i), {
      target: { value: title },
    });

    if (description !== undefined) {
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { value: description },
      });
    }

    fireEvent.change(screen.getByTestId("datepicker"), {
      target: { value: endAt },
    });

    const inputs = getOptionInputs();
    options.forEach((value, index) => {
      if (inputs[index]) {
        fireEvent.change(inputs[index], { target: { value } });
      }
    });
  }

  it("affiche Accès refusé quand session est null", () => {
    render(<UpsertPollView session={null} onBack={onBack} onDone={onDone} />);

    expect(screen.getByText("Accès refusé.")).toBeInTheDocument();
  });

  it("affiche Accès refusé quand le rôle ne peut pas gérer les sondages", () => {
    render(
      <UpsertPollView
        session={memberSession}
        onBack={onBack}
        onDone={onDone}
      />,
    );

    expect(screen.getByText("Accès refusé.")).toBeInTheDocument();
  });

  it("affiche le formulaire de création pour admin", () => {
    renderView();

    expect(
      screen.getByRole("heading", { name: "Créer un sondage" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Titre/i)).toBeInTheDocument();
  });

  it("affiche une erreur si soumission sans titre", async () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(screen.getByText(/Le titre est obligatoire/i)).toBeInTheDocument();
    });

    expect(apiCreatePoll).not.toHaveBeenCalled();
  });

  it("affiche une erreur si la date est invalide", async () => {
    renderView();

    fireEvent.change(screen.getByLabelText(/Titre/i), {
      target: { value: "Poll sans date" },
    });

    const inputs = getOptionInputs();
    fireEvent.change(inputs[0], { target: { value: "Opt 1" } });
    fireEvent.change(inputs[1], { target: { value: "Opt 2" } });

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(
        screen.getByText("La date de fin est invalide."),
      ).toBeInTheDocument();
    });

    expect(apiCreatePoll).not.toHaveBeenCalled();
  });

  it("affiche une erreur si moins de deux réponses actives sont fournies", async () => {
    renderView();

    fillCreateForm({
      title: "Poll invalide",
      options: ["Une seule option", "   "],
    });

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Un sondage doit contenir au moins deux réponses."),
      ).toBeInTheDocument();
    });

    expect(apiCreatePoll).not.toHaveBeenCalled();
  });

  it("crée un sondage valide et appelle onDone", async () => {
    vi.mocked(apiCreatePoll).mockResolvedValue({
      pollID: 123,
      message: "Poll created",
    });

    renderView();

    fillCreateForm();

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(apiCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Poll",
          options: ["Opt 1", "Opt 2"],
        }),
      );
    });

    expect(onDone).toHaveBeenCalled();
  });

  it("affiche 'Création…' pendant l'enregistrement en création", async () => {
    let resolveCreate!: (value: { pollID: number; message: string }) => void;

    vi.mocked(apiCreatePoll).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        }),
    );

    renderView();

    fillCreateForm();

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    expect(screen.getByRole("button", { name: "Création…" })).toBeDisabled();

    resolveCreate({ pollID: 123, message: "Poll created" });

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("en création envoie description à null quand elle ne contient que des espaces", async () => {
    vi.mocked(apiCreatePoll).mockResolvedValue({
      pollID: 123,
      message: "Poll created",
    });

    renderView();

    fillCreateForm({ title: "Poll propre", description: "    " });

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(apiCreatePoll).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Poll propre",
          description: null,
          options: ["Opt 1", "Opt 2"],
        }),
      );
    });
  });

  it("affiche le message fallback si l'enregistrement échoue avec une valeur non Error", async () => {
    vi.mocked(apiCreatePoll).mockRejectedValue("boom");

    renderView();

    fillCreateForm();

    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Impossible d'enregistrer le sondage."),
      ).toBeInTheDocument();
    });

    expect(onDone).not.toHaveBeenCalled();
  });

  it("ajoute une réponse puis supprime une option locale quand il y a plus de deux réponses", () => {
    renderView();

    expect(getOptionInputs()).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", { name: /Ajouter une réponse/i }),
    );
    expect(getOptionInputs()).toHaveLength(3);

    const deleteButtons = screen.getAllByRole("button", { name: /Supprimer/i });
    fireEvent.click(deleteButtons[2]);

    expect(getOptionInputs()).toHaveLength(2);
  });

  it("empêche la suppression quand il ne reste que deux réponses actives", () => {
    renderView();

    const deleteButtons = screen.getAllByRole("button", { name: "Supprimer" });
    expect(deleteButtons).toHaveLength(2);
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeDisabled();
  });

  it("appelle onBack au clic sur Fermer ou Annuler", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onBack).toHaveBeenCalled();

    onBack.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("affiche Chargement… en mode édition puis le formulaire", async () => {
    vi.mocked(apiGetPoll).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockPoll), 10);
        }),
    );

    renderView({ pollID: 1 });

    expect(screen.getByText("Chargement…")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Modifier le sondage" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
  });

  it("affiche l'erreur et Retour quand apiGetPoll échoue en édition", async () => {
    vi.mocked(apiGetPoll).mockRejectedValue(new Error("Not found"));

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retour" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("affiche le message fallback si le chargement en édition échoue avec une valeur non Error", async () => {
    vi.mocked(apiGetPoll).mockRejectedValue("boom");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger le sondage."),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Retour" })).toBeInTheDocument();
  });

  it("affiche un écran d'erreur quand apiGetPoll renvoie null", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(null as unknown as PollDetails);

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Retour" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/null|Cannot read/i)).toBeInTheDocument();
  });

  it("en édition marque une option persistée supprimée puis permet de la restaurer", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPollWith3Options);

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Modifier le sondage" }),
      ).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Supprimer/i });
    fireEvent.click(deleteButtons[2]);

    expect(screen.getByDisplayValue("C (supprimée)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Restaurer/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Restaurer/i }));

    await waitFor(() => {
      expect(
        screen.queryByDisplayValue("C (supprimée)"),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("C")).toBeInTheDocument();
  });

  it("en édition supprime une option persistée sans renommage ni création", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPollWith3Options);
    vi.mocked(apiUpdatePoll).mockResolvedValue("Poll updated");
    vi.mocked(apiDeletePollOption).mockResolvedValue("Option deleted");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteButtons[2]);

    expect(screen.getByDisplayValue("C (supprimée)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiDeletePollOption).toHaveBeenCalledWith(1, 3);
    });

    expect(apiUpdatePollOption).not.toHaveBeenCalled();
    expect(apiCreatePollOption).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it("en édition renomme une option sans suppression ni création", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPoll);
    vi.mocked(apiUpdatePoll).mockResolvedValue("Poll updated");
    vi.mocked(apiUpdatePollOption).mockResolvedValue("Option updated");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    const inputs = getOptionInputs();
    fireEvent.change(inputs[0], { target: { value: "A renommée" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiUpdatePollOption).toHaveBeenCalledWith(1, 1, {
        label: "A renommée",
      });
    });

    expect(apiDeletePollOption).not.toHaveBeenCalled();
    expect(apiCreatePollOption).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it("en édition crée une nouvelle option sans suppression ni renommage", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPoll);
    vi.mocked(apiUpdatePoll).mockResolvedValue("Poll updated");
    vi.mocked(apiCreatePollOption).mockResolvedValue("Option created");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une réponse" }),
    );

    const inputs = getOptionInputs();
    fireEvent.change(inputs[2], { target: { value: "Nouvelle réponse" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiCreatePollOption).toHaveBeenCalledWith(1, {
        label: "Nouvelle réponse",
      });
    });

    expect(apiDeletePollOption).not.toHaveBeenCalled();
    expect(apiUpdatePollOption).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it("en édition met à jour le sondage puis supprime, renomme et crée des options avant onDone", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPollWith3Options);
    vi.mocked(apiUpdatePoll).mockResolvedValue("Poll updated");
    vi.mocked(apiDeletePollOption).mockResolvedValue("Option deleted");
    vi.mocked(apiUpdatePollOption).mockResolvedValue("Option updated");
    vi.mocked(apiCreatePollOption).mockResolvedValue("Option created");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Titre/i), {
      target: { value: "Existing Poll Updated" },
    });

    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Desc updated" },
    });

    const inputsBefore = getOptionInputs();
    fireEvent.change(inputsBefore[0], { target: { value: "A renamed" } });

    const deleteButtons = screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteButtons[1]);

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une réponse" }),
    );

    const inputsAfter = getOptionInputs();
    fireEvent.change(inputsAfter[2], { target: { value: "New option" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiUpdatePoll).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: "Existing Poll Updated",
          description: "Desc updated",
          maxSelections: 1,
        }),
      );
    });

    expect(apiDeletePollOption).toHaveBeenCalledWith(1, 2);
    expect(apiUpdatePollOption).toHaveBeenCalledWith(1, 1, {
      label: "A renamed",
    });
    expect(apiCreatePollOption).toHaveBeenCalledWith(1, {
      label: "New option",
    });

    expect(onDone).toHaveBeenCalled();
  });

  it("affiche l’erreur si la synchro des options échoue en édition", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPollWith3Options);
    vi.mocked(apiUpdatePoll).mockResolvedValue("Poll updated");
    vi.mocked(apiUpdatePollOption).mockRejectedValue(
      new Error("rename failed"),
    );

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("A")).toBeInTheDocument();
    });

    const inputs = getOptionInputs();
    fireEvent.change(inputs[0], { target: { value: "A renamed" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("rename failed")).toBeInTheDocument();
    });

    expect(onDone).not.toHaveBeenCalled();
  });

  it("charge une date invalide en édition puis refuse l’enregistrement", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue({
      ...mockPoll,
      endAt: "date-invalide",
    });

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Modifier le sondage" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("La date de fin est invalide."),
      ).toBeInTheDocument();
    });

    expect(apiUpdatePoll).not.toHaveBeenCalled();
  });

  it("affiche 'Enregistrement…' pendant l'enregistrement en édition", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPoll);

    let resolveUpdate!: (value: string) => void;
    vi.mocked(apiUpdatePoll).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      screen.getByRole("button", { name: "Enregistrement…" }),
    ).toBeDisabled();

    resolveUpdate("Poll updated");

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
  });

  it("affiche le message fallback si l'enregistrement en édition échoue avec une valeur non Error", async () => {
    vi.mocked(apiGetPoll).mockResolvedValue(mockPoll);
    vi.mocked(apiUpdatePoll).mockRejectedValue("boom");

    renderView({ pollID: 1 });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Existing Poll")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Impossible d'enregistrer le sondage."),
      ).toBeInTheDocument();
    });

    expect(onDone).not.toHaveBeenCalled();
  });
});
