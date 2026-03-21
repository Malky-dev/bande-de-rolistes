import { useCallback, useState } from "react";

import { INITIAL_RELOAD_TOKEN } from "@/shared/constants";

export type UpsertModalMode = "create" | "edit" | null;

export interface UpsertModalState<TIdentifier> {
  mode: UpsertModalMode;
  editingId: TIdentifier | null;
}

export interface UseUpsertModalResult<TIdentifier> {
  state: UpsertModalState<TIdentifier>;
  reloadToken: number;
  isOpen: boolean;
  openCreate: () => void;
  openEdit: (id: TIdentifier) => void;
  close: () => void;
  handleSaved: () => void;
}

function buildClosedState<TIdentifier>(): UpsertModalState<TIdentifier> {
  return {
    mode: null,
    editingId: null,
  };
}

export function useUpsertModal<
  TIdentifier,
>(): UseUpsertModalResult<TIdentifier> {
  const [state, setState] =
    useState<UpsertModalState<TIdentifier>>(buildClosedState);
  const [reloadToken, setReloadToken] = useState<number>(INITIAL_RELOAD_TOKEN);

  const openCreate = useCallback(() => {
    setState({
      mode: "create",
      editingId: null,
    });
  }, []);

  const openEdit = useCallback((id: TIdentifier) => {
    setState({
      mode: "edit",
      editingId: id,
    });
  }, []);

  const close = useCallback(() => {
    setState(buildClosedState<TIdentifier>());
  }, []);

  const handleSaved = useCallback(() => {
    setReloadToken((current) => current + 1);
    setState(buildClosedState<TIdentifier>());
  }, []);

  return {
    state,
    reloadToken,
    isOpen: state.mode !== null,
    openCreate,
    openEdit,
    close,
    handleSaved,
  };
}
