import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useQuotesPanel } from "@/client/components/quotesPanel/useQuotesPanel";

vi.mock("@/api/auth", () => ({
  apiQuotesCreate: vi.fn(),
  apiQuotesDelete: vi.fn(),
  apiQuotesList: vi.fn(),
  apiQuotesUpdate: vi.fn(),
}));

import { apiQuotesCreate, apiQuotesList, apiQuotesUpdate } from "@/api/auth";

describe("useQuotesPanel", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("n'essaie pas de sauvegarder si aucune édition n'est active", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
    });

    const { result } = renderHook(() => useQuotesPanel());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.saveEdit();
    });

    expect(apiQuotesUpdate).not.toHaveBeenCalled();
  });

  it("ne ferme pas la modale pendant l'enregistrement", async () => {
    type CreatedQuote = {
      quoteID: number;
      content: string;
      author: string;
    };

    let resolveCreate!: (value: CreatedQuote) => void;

    const createPromise = new Promise<CreatedQuote>((resolve) => {
      resolveCreate = resolve;
    });

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

    vi.mocked(apiQuotesCreate).mockReturnValue(createPromise);

    const { result } = renderHook(() => useQuotesPanel());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.openCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(true);

    act(() => {
      result.current.updateCreateForm("content", "Hello");
      result.current.updateCreateForm("author", "Morpheus");
    });

    await act(async () => {
      void result.current.submitCreate();
      await Promise.resolve();
    });

    expect(result.current.isSaving).toBe(true);
    expect(result.current.isCreateModalOpen).toBe(true);

    act(() => {
      result.current.closeCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(true);

    await act(async () => {
      resolveCreate({
        quoteID: 1,
        content: "Hello",
        author: "Morpheus",
      });
      await createPromise;
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(result.current.isCreateModalOpen).toBe(false);
  });

  it("ferme la modale et réinitialise le formulaire hors enregistrement", async () => {
    vi.mocked(apiQuotesList).mockResolvedValue({
      items: [],
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
    });

    const { result } = renderHook(() => useQuotesPanel());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.openCreateModal();
      result.current.updateCreateForm("content", "Le gras, c'est la vie");
      result.current.updateCreateForm("author", "Karadoc");
    });

    expect(result.current.isCreateModalOpen).toBe(true);
    expect(result.current.createForm).toEqual({
      content: "Le gras, c'est la vie",
      author: "Karadoc",
    });

    act(() => {
      result.current.closeCreateModal();
    });

    expect(result.current.isCreateModalOpen).toBe(false);
    expect(result.current.createForm).toEqual({
      content: "",
      author: "",
    });
  });
});
