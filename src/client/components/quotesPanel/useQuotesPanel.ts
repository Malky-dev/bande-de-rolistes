import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  apiQuotesCreate,
  apiQuotesDelete,
  apiQuotesList,
  apiQuotesUpdate,
  type QuoteAdmin,
} from "@/api/auth";
import {
  getQuotesRangeLabel,
  getQuotesReloadPageAfterDelete,
} from "@/client/components/quotesPanel.helpers";
import type { QuoteFormState } from "@/client/components/quotesPanel/types";
import { QUOTES_PAGE_SIZE } from "@/shared/constants";

const EMPTY_FORM_STATE: QuoteFormState = {
  content: "",
  author: "",
};

interface UseQuotesPanelResult {
  page: number;
  totalPages: number;
  totalItems: number;
  items: QuoteAdmin[];
  loading: boolean;
  query: string;
  activeQuery: string;
  error: string | null;
  successMessage: string | null;
  isCreateModalOpen: boolean;
  isSaving: boolean;
  isUpdating: boolean;
  createForm: QuoteFormState;
  editId: number | null;
  editForm: QuoteFormState;
  rangeLabel: string;
  reload: (targetPage?: number, nextQuery?: string) => Promise<void>;
  setQuery: (value: string) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  submitSearch: () => Promise<void>;
  resetSearch: () => Promise<void>;
  submitCreate: () => Promise<void>;
  updateCreateForm: (field: keyof QuoteFormState, value: string) => void;
  startEdit: (quote: QuoteAdmin) => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<void>;
  updateEditForm: (field: keyof QuoteFormState, value: string) => void;
  deleteQuote: (quote: QuoteAdmin) => Promise<void>;
}

export function useQuotesPanel(): UseQuotesPanelResult {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [items, setItems] = useState<QuoteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] =
    useState<QuoteFormState>(EMPTY_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<QuoteFormState>(EMPTY_FORM_STATE);
  const [isUpdating, setIsUpdating] = useState(false);

  const pageRef = useRef(page);
  const activeQueryRef = useRef(activeQuery);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    activeQueryRef.current = activeQuery;
  }, [activeQuery]);

  const showSuccessMessage = useCallback((message: string): void => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), 2000);
  }, []);

  const reload = useCallback(
    async (targetPage?: number, nextQuery?: string): Promise<void> => {
      const resolvedPage = targetPage ?? pageRef.current;
      const resolvedQuery = nextQuery ?? activeQueryRef.current;

      try {
        setLoading(true);
        setError(null);

        const data = await apiQuotesList(
          resolvedPage,
          QUOTES_PAGE_SIZE,
          resolvedQuery,
        );

        setItems(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalItems);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erreur chargement");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void reload(1, "");
  }, [reload]);

  const openCreateModal = useCallback((): void => {
    setError(null);
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback((): void => {
    if (isSaving) {
      return;
    }

    setIsCreateModalOpen(false);
    setCreateForm(EMPTY_FORM_STATE);
  }, [isSaving]);

  const submitSearch = useCallback(async (): Promise<void> => {
    const trimmedQuery = query.trim();
    setActiveQuery(trimmedQuery);
    activeQueryRef.current = trimmedQuery;
    await reload(1, trimmedQuery);
  }, [query, reload]);

  const resetSearch = useCallback(async (): Promise<void> => {
    setQuery("");
    setActiveQuery("");
    activeQueryRef.current = "";
    await reload(1, "");
  }, [reload]);

  const updateCreateForm = useCallback(
    (field: keyof QuoteFormState, value: string): void => {
      setCreateForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const submitCreate = useCallback(async (): Promise<void> => {
    try {
      setIsSaving(true);
      setError(null);

      await apiQuotesCreate(createForm);
      setCreateForm(EMPTY_FORM_STATE);
      setIsCreateModalOpen(false);
      showSuccessMessage("Citation ajoutée");
      await reload(1, activeQueryRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur d'ajout");
    } finally {
      setIsSaving(false);
    }
  }, [createForm, reload, showSuccessMessage]);

  const startEdit = useCallback((quote: QuoteAdmin): void => {
    setEditId(quote.quoteID);
    setEditForm({
      content: quote.content,
      author: quote.author,
    });
  }, []);

  const cancelEdit = useCallback((): void => {
    setEditId(null);
    setEditForm(EMPTY_FORM_STATE);
  }, []);

  const updateEditForm = useCallback(
    (field: keyof QuoteFormState, value: string): void => {
      setEditForm((current) => ({
        ...current,
        [field]: value,
      }));
    },
    [],
  );

  const saveEdit = useCallback(async (): Promise<void> => {
    if (editId === null) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      await apiQuotesUpdate(editId, editForm);
      showSuccessMessage("Citation mise à jour");
      cancelEdit();
      await reload(pageRef.current, activeQueryRef.current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur update");
    } finally {
      setIsUpdating(false);
    }
  }, [cancelEdit, editForm, editId, reload, showSuccessMessage]);

  const deleteQuote = useCallback(
    async (quote: QuoteAdmin): Promise<void> => {
      const confirmed = window.confirm(
        `Supprimer la citation #${quote.quoteID} ?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        setError(null);

        await apiQuotesDelete(quote.quoteID);
        showSuccessMessage("Citation supprimée");

        await reload(
          getQuotesReloadPageAfterDelete(items.length, pageRef.current),
          activeQueryRef.current,
        );
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erreur suppression");
      }
    },
    [items.length, reload, showSuccessMessage],
  );

  const rangeLabel = useMemo(
    () => getQuotesRangeLabel(page, totalItems, QUOTES_PAGE_SIZE),
    [page, totalItems],
  );

  return {
    page,
    totalPages,
    totalItems,
    items,
    loading,
    query,
    activeQuery,
    error,
    successMessage,
    isCreateModalOpen,
    isSaving,
    isUpdating,
    createForm,
    editId,
    editForm,
    rangeLabel,
    reload,
    setQuery,
    openCreateModal,
    closeCreateModal,
    submitSearch,
    resetSearch,
    submitCreate,
    updateCreateForm,
    startEdit,
    cancelEdit,
    saveEdit,
    updateEditForm,
    deleteQuote,
  };
}
