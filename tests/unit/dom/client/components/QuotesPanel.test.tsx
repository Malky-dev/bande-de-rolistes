import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuotesPanel from "@/client/components/QuotesPanel";

vi.mock("@/api/auth", () => ({
  apiQuotesCreate: vi.fn(),
  apiQuotesDelete: vi.fn(),
  apiQuotesList: vi.fn(),
  apiQuotesUpdate: vi.fn(),
}));

import {
  buildQuotesPageWindow,
  getQuotesRangeLabel,
  getQuotesReloadPageAfterDelete,
} from "@/client/components/quotesPanel.helpers";

import {
  apiQuotesCreate,
  apiQuotesDelete,
  apiQuotesList,
  apiQuotesUpdate,
} from "@/api/auth";

describe("QuotesPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("calcule les fenêtres de pagination et les libellés des citations", () => {
    expect(buildQuotesPageWindow(5, 10)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(buildQuotesPageWindow(1, 2)).toEqual([1, 2]);
    expect(getQuotesRangeLabel(1, 0, 10)).toBe("0-0 / 0");
    expect(getQuotesRangeLabel(2, 17, 10)).toBe("11-17 / 17");
    expect(getQuotesReloadPageAfterDelete(1, 2)).toBe(1);
    expect(getQuotesReloadPageAfterDelete(2, 2)).toBe(2);
  });

  it("charge et affiche les citations", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Hello/i)).toBeInTheDocument();
    });
    expect(screen.getByText("1-1 / 1")).toBeInTheDocument();
  });

  it("affiche l’erreur de chargement", async () => {
    vi.mocked(apiQuotesList).mockRejectedValue(new Error("Load failed"));

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });
  });

  it("affiche l’erreur de chargement générique pour les échecs non Error", async () => {
    vi.mocked(apiQuotesList).mockRejectedValue("boom");

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Erreur chargement")).toBeInTheDocument();
    });
  });

  it("crée une citation et recharge la première page", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
    vi.mocked(apiQuotesCreate).mockResolvedValue({
      quoteID: 1,
      content: "Hello",
      author: "Morpheus",
    });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Ajouter une citation" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une citation" }),
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Texte de la citation"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Texte de la citation"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByPlaceholderText("Auteur (optionnel)"), {
      target: { value: "Morpheus" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(screen.getByText("Citation ajoutée")).toBeInTheDocument();
    });
    expect(apiQuotesCreate).toHaveBeenCalledWith({
      content: "Hello",
      author: "Morpheus",
    });
    expect(apiQuotesList).toHaveBeenLastCalledWith(1, 10, "");
  });

  it("recharge la page courante au clic sur actualiser", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 2,
        limit: 10,
        totalItems: 20,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 2,
        limit: 10,
        totalItems: 20,
        totalPages: 2,
      });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText("11-20 / 20")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(2, 10, "");
    });
  });

  it("affiche les messages génériques de secours pour les échecs non Error en création, mise à jour et suppression", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });
    vi.mocked(apiQuotesCreate).mockRejectedValueOnce("boom");
    vi.mocked(apiQuotesUpdate).mockRejectedValueOnce("boom");
    vi.mocked(apiQuotesDelete).mockRejectedValueOnce("boom");
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Éditer" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter une citation" }),
    );
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Texte de la citation"),
      ).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText("Texte de la citation"), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur d'ajout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur suppression")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Éditer" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur update")).toBeInTheDocument();
    });
  });

  it("recherche puis réinitialise la requête", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
    });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Rechercher/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), {
      target: { value: "  neo  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }));

    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(1, 10, "neo");
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(1, 10, "");
    });
  });

  it("modifie une citation et gère les erreurs de mise à jour", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Updated", author: "Neo" }],
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
    vi.mocked(apiQuotesUpdate).mockResolvedValue({
      quoteID: 1,
      content: "Updated",
      author: "Neo",
    });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Éditer" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Éditer" }));
    fireEvent.change(screen.getByDisplayValue("Hello"), {
      target: { value: "Updated" },
    });
    fireEvent.change(screen.getByDisplayValue("Morpheus"), {
      target: { value: "Neo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(apiQuotesUpdate).toHaveBeenCalledWith(1, {
        content: "Updated",
        author: "Neo",
      });
    });

    vi.mocked(apiQuotesUpdate).mockRejectedValueOnce(
      new Error("Update failed"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Éditer" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });
  });

  it("supprime une citation après confirmation et la conserve si la boîte de confirmation est annulée", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 2,
        limit: 10,
        totalItems: 11,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [],
        page: 1,
        limit: 10,
        totalItems: 10,
        totalPages: 1,
      });
    vi.mocked(apiQuotesDelete).mockResolvedValue();
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(false));

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Hello/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(apiQuotesDelete).not.toHaveBeenCalled();

    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(apiQuotesDelete).toHaveBeenCalledWith(1);
    });
    expect(apiQuotesList).toHaveBeenLastCalledWith(1, 10, "");
  });

  it("affiche l’erreur de suppression quand la suppression échoue", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });
    vi.mocked(apiQuotesDelete).mockRejectedValue(new Error("Delete failed"));
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Supprimer" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });

  it("annule l’édition et gère les raccourcis de pagination", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 5,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      })
      .mockResolvedValue({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 1,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Éditer" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Éditer" }));
    fireEvent.change(screen.getByDisplayValue("Hello"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    fireEvent.click(screen.getByRole("button", { name: "Éditer" }));

    expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(1, 10, "");
    });
  });

  it("gère les contrôles de pagination précédent, suivant et dernière page", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 5,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 4,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 10,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText("41-50 / 100")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "◀" }));
    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(4, 10, "");
    });

    fireEvent.click(screen.getByRole("button", { name: "10" }));
    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(10, 10, "");
    });
  });

  it("navigue vers une page non courante dans la fenêtre puis vers la page suivante", async () => {
    vi.mocked(apiQuotesList)
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 5,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 6,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      })
      .mockResolvedValueOnce({
        items: [{ quoteID: 11, content: "Hello", author: "Morpheus" }],
        page: 3,
        limit: 10,
        totalItems: 100,
        totalPages: 10,
      });

    render(<QuotesPanel />);

    await waitFor(() => {
      expect(screen.getByText("41-50 / 100")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "▶" }));
    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(6, 10, "");
    });

    fireEvent.click(screen.getByRole("button", { name: "3" }));
    await waitFor(() => {
      expect(apiQuotesList).toHaveBeenLastCalledWith(3, 10, "");
    });
  });
});
