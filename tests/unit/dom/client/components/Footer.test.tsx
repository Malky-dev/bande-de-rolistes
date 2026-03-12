import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Footer from "@/client/components/Footer";
import { apiQuote } from "@/api/authApi";

vi.mock("@/api/authApi", () => ({
  apiQuote: vi.fn(),
}));

describe("Footer", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche la citation renvoyée par l’API", async () => {
    vi.mocked(apiQuote).mockResolvedValue({
      content: "Wake up, Neo.",
      author: "Morpheus",
    });

    render(<Footer onChangeView={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Wake up, Neo\./i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Morpheus/i)).toBeInTheDocument();
  });

  it("affiche la citation de secours quand l’API échoue", async () => {
    vi.mocked(apiQuote).mockRejectedValue(new Error("boom"));

    render(<Footer onChangeView={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Tout ça n'est qu'une farce\./i),
      ).toBeInTheDocument();
    });
  });

  it("affiche la citation sans suffixe d’auteur quand l’auteur est vide", async () => {
    vi.mocked(apiQuote).mockResolvedValue({
      content: "Wake up, Neo.",
      author: "",
    });

    render(<Footer onChangeView={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/« Wake up, Neo\./i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Wake up, Neo\..*Morpheus/i)).toBeNull();
  });

  it("appelle onChangeView avec rules au clic sur le lien du footer", async () => {
    vi.mocked(apiQuote).mockRejectedValue(new Error("boom"));
    const onChangeView = vi.fn();

    render(<Footer onChangeView={onChangeView} />);

    const link = await screen.findByText(/Statuts et règlement intérieur/i);
    fireEvent.click(link);

    expect(onChangeView).toHaveBeenCalledTimes(1);
    expect(onChangeView).toHaveBeenCalledWith("rules");
  });

  it("ignore une réponse tardive de citation après le démontage", async () => {
    let resolveQuote:
      | ((value: { content: string; author: string }) => void)
      | undefined;

    vi.mocked(apiQuote).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuote = resolve;
        }),
    );

    const { unmount } = render(<Footer onChangeView={vi.fn()} />);

    unmount();
    resolveQuote?.({ content: "Late quote", author: "Ghost" });

    await waitFor(() => {
      expect(apiQuote).toHaveBeenCalledTimes(1);
    });
  });

  it("ignore un échec tardif de citation après le démontage", async () => {
    let rejectQuote: ((reason?: unknown) => void) | undefined;

    vi.mocked(apiQuote).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectQuote = reject;
        }),
    );

    const { unmount } = render(<Footer onChangeView={vi.fn()} />);

    unmount();
    rejectQuote?.(new Error("boom"));

    await waitFor(() => {
      expect(apiQuote).toHaveBeenCalledTimes(1);
    });
  });
});
