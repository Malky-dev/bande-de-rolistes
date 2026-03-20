import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiCreatePollOption,
  apiDeletePollOption,
  apiUpdatePollOption,
} from "@/api/polls";
import PollOptionsAdmin from "@/client/components/polls/PollOptionsAdmin";
import type { PollDetails } from "@/types/api/polls";

vi.mock("@/api/polls", () => ({
  apiCreatePollOption: vi.fn(),
  apiUpdatePollOption: vi.fn(),
  apiDeletePollOption: vi.fn(),
}));

const basePoll: PollDetails = {
  pollID: 1,
  title: "Test",
  description: null,
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
    {
      optionID: 1,
      label: "Option A",
      displayOrder: 0,
      voteCount: 0,
      voters: [],
    },
    {
      optionID: 2,
      label: "Option B",
      displayOrder: 1,
      voteCount: 0,
      voters: [],
    },
  ],
};

describe("PollOptionsAdmin", () => {
  const onChanged = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("affiche le titre et la liste des options avec champs et boutons", () => {
    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    expect(
      screen.getByRole("heading", { name: "Gérer les options" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Option B")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Renommer" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Supprimer" })).toHaveLength(
      2,
    );
    expect(
      screen.getByRole("button", { name: "Ajouter l'option" }),
    ).toBeInTheDocument();
  });

  it("affiche les options triées par displayOrder", () => {
    render(
      <PollOptionsAdmin
        poll={{
          ...basePoll,
          options: [
            {
              optionID: 11,
              label: "Troisième",
              displayOrder: 2,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 12,
              label: "Première",
              displayOrder: 0,
              voteCount: 0,
              voters: [],
            },
            {
              optionID: 13,
              label: "Deuxième",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
          ],
        }}
        onChanged={onChanged}
      />,
    );

    const inputs = screen.getAllByRole("textbox");
    const values = inputs
      .map((input) => (input as HTMLInputElement).value)
      .filter((value) => value !== "");

    expect(values.slice(0, 3)).toEqual(["Première", "Deuxième", "Troisième"]);
  });

  it("affiche une erreur si on ajoute une option avec libellé vide", async () => {
    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Le libellé de la nouvelle option est obligatoire/i,
      );
    });

    expect(apiCreatePollOption).not.toHaveBeenCalled();
  });

  it("appelle apiCreatePollOption et onChanged quand on ajoute une option valide", async () => {
    vi.mocked(apiCreatePollOption).mockResolvedValue("Option ajoutée.");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/Nouvelle option/i), {
      target: { value: "New Option" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(apiCreatePollOption).toHaveBeenCalledWith(1, {
        label: "New Option",
      });
    });

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith("Option ajoutée.");
    });
  });

  it("affiche l'erreur API à l'ajout", async () => {
    vi.mocked(apiCreatePollOption).mockRejectedValue(
      new Error("Erreur réseau"),
    );

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/Nouvelle option/i), {
      target: { value: "New" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Erreur réseau");
    });
  });

  it("n'appelle pas apiUpdatePollOption si le libellé est inchangé", async () => {
    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(apiUpdatePollOption).not.toHaveBeenCalled();
    });
  });

  it("appelle apiUpdatePollOption quand on renomme avec un libellé différent", async () => {
    vi.mocked(apiUpdatePollOption).mockResolvedValue("Option modifiée.");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByDisplayValue("Option A"), {
      target: { value: "Option A renamed" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(apiUpdatePollOption).toHaveBeenCalledWith(1, 1, {
        label: "Option A renamed",
      });
    });

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith("Option modifiée.");
    });
  });

  it("affiche une erreur si on renomme avec libellé vide", async () => {
    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByDisplayValue("Option A"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Le libellé de l'option est obligatoire/i,
      );
    });
  });

  it("n'affiche pas d'erreur et ne fait rien si le renommage est inchangé après rerender", async () => {
    const { rerender } = render(
      <PollOptionsAdmin poll={basePoll} onChanged={onChanged} />,
    );

    rerender(
      <PollOptionsAdmin
        poll={{
          ...basePoll,
          options: [
            {
              optionID: 2,
              label: "Option B",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
          ],
        }}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(apiUpdatePollOption).not.toHaveBeenCalled();
    });

    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche l'erreur API au renommage", async () => {
    vi.mocked(apiUpdatePollOption).mockRejectedValue(
      new Error("rename failed"),
    );

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByDisplayValue("Option A"), {
      target: { value: "Option A renommée" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("rename failed");
    });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("appelle apiDeletePollOption après confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(apiDeletePollOption).mockResolvedValue("Option supprimée.");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    await waitFor(() => {
      expect(apiDeletePollOption).toHaveBeenCalledWith(1, 1);
    });

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith("Option supprimée.");
    });
  });

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    await waitFor(() => {
      expect(apiDeletePollOption).not.toHaveBeenCalled();
    });
  });

  it("supprime l'option restante après rerender avec confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(apiDeletePollOption).mockResolvedValue("Option supprimée.");

    const { rerender } = render(
      <PollOptionsAdmin poll={basePoll} onChanged={onChanged} />,
    );

    rerender(
      <PollOptionsAdmin
        poll={{
          ...basePoll,
          options: [
            {
              optionID: 2,
              label: "Option B",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
          ],
        }}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    await waitFor(() => {
      expect(apiDeletePollOption).toHaveBeenCalledWith(1, 2);
    });

    expect(onChanged).toHaveBeenCalledWith("Option supprimée.");
  });

  it("affiche l'erreur API à la suppression", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    vi.mocked(apiDeletePollOption).mockRejectedValue(
      new Error("delete failed"),
    );

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("delete failed");
    });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("affiche le message fallback si le renommage rejette avec une valeur non Error", async () => {
    vi.mocked(apiUpdatePollOption).mockRejectedValue("boom");
    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByDisplayValue("Option A"), {
      target: { value: "Option A bis" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Renommer" })[0]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Impossible de modifier l'option.",
      );
    });
  });

  it("affiche le message fallback si l'ajout rejette avec une valeur non Error", async () => {
    vi.mocked(apiCreatePollOption).mockRejectedValue("boom");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/Nouvelle option/i), {
      target: { value: "Nouvelle option" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Impossible d'ajouter l'option.",
      );
    });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("affiche le message fallback si l'ajout rejette avec une valeur non Error", async () => {
    vi.mocked(apiCreatePollOption).mockRejectedValue("boom");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/Nouvelle option/i), {
      target: { value: "Nouvelle option" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Impossible d'ajouter l'option.",
      );
    });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("ne fait rien si on tente de renommer une option devenue introuvable après rerender", async () => {
    const { rerender } = render(
      <PollOptionsAdmin poll={basePoll} onChanged={onChanged} />,
    );

    fireEvent.change(screen.getByDisplayValue("Option A"), {
      target: { value: "Option A renommée" },
    });

    rerender(
      <PollOptionsAdmin
        poll={{
          ...basePoll,
          options: [
            {
              optionID: 2,
              label: "Option B",
              displayOrder: 1,
              voteCount: 0,
              voters: [],
            },
          ],
        }}
        onChanged={onChanged}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Renommer" }));

    await waitFor(() => {
      expect(apiUpdatePollOption).not.toHaveBeenCalled();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("affiche le message fallback si l'ajout rejette avec une valeur non Error", async () => {
    vi.mocked(apiCreatePollOption).mockRejectedValue("boom");

    render(<PollOptionsAdmin poll={basePoll} onChanged={onChanged} />);

    fireEvent.change(screen.getByLabelText(/Nouvelle option/i), {
      target: { value: "Nouvelle option" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter l'option" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Impossible d'ajouter l'option.",
      );
    });

    expect(onChanged).not.toHaveBeenCalled();
  });
});
