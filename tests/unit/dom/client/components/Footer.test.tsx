import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Footer from "@/client/components/Footer";
import { fireEvent } from "@testing-library/react";

vi.mock("@/api/authApi", () => ({
  apiQuote: vi.fn(),
}));

import { apiQuote } from "@/api/authApi";

describe("Footer", () => {
  const onChangeView = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the quote from the API", async () => {
    vi.mocked(apiQuote).mockResolvedValue({
      content: "Wake up, Neo.",
      author: "Morpheus",
    });

    render(<Footer onChangeView={onChangeView} />);

    await waitFor(() => {
      expect(screen.getByText(/Wake up, Neo\./i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Morpheus/i)).toBeInTheDocument();
  });

  it("renders the fallback quote when the API fails", async () => {
    vi.mocked(apiQuote).mockRejectedValue(new Error("boom"));

    render(<Footer onChangeView={onChangeView} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Tout \u00e7a n'est qu'une farce\./i),
      ).toBeInTheDocument();
    });
  });

  it("renders the quote without an author suffix when the author is empty", async () => {
    vi.mocked(apiQuote).mockResolvedValue({
      content: "Wake up, Neo.",
      author: "",
    });

    render(<Footer onChangeView={onChangeView} />);

    await waitFor(() => {
      expect(screen.getByText(/\u00ab Wake up, Neo\./i)).toBeInTheDocument();
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

  it("ignores a late quote response after unmount", async () => {
    let resolveQuote:
      | ((value: { content: string; author: string }) => void)
      | undefined;

    vi.mocked(apiQuote).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveQuote = resolve;
        }),
    );

    const { unmount } = render(<Footer onChangeView={onChangeView} />);

    unmount();
    resolveQuote?.({ content: "Late quote", author: "Ghost" });

    await waitFor(() => {
      expect(apiQuote).toHaveBeenCalledTimes(1);
    });
  });

  it("ignores a late quote failure after unmount", async () => {
    let rejectQuote: ((reason?: unknown) => void) | undefined;

    vi.mocked(apiQuote).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectQuote = reject;
        }),
    );

    const { unmount } = render(<Footer onChangeView={onChangeView} />);

    unmount();
    rejectQuote?.(new Error("boom"));

    await waitFor(() => {
      expect(apiQuote).toHaveBeenCalledTimes(1);
    });
  });
});
