import { useCallback, useEffect, useRef, useState } from "react";

import { apiAdminRoles, apiAdminUpdateRole, apiAdminUsers } from "@/api/auth";
import type { AdminRole, AdminUser } from "@/types/api/admin";

const LOAD_ERROR_MESSAGE = "Erreur lors du chargement des données";
const UPDATE_ERROR_MESSAGE = "Erreur lors de la modification du rôle";
const SUCCESS_MESSAGE_DURATION_MS = 3000;

function buildLoadErrorMessage(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : LOAD_ERROR_MESSAGE;

  if (
    message.includes("Token") ||
    message.includes("UNAUTHORIZED") ||
    message.includes("FORBIDDEN")
  ) {
    return `${message}. Veuillez vous reconnecter.`;
  }

  return message;
}

function buildUpdateErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : UPDATE_ERROR_MESSAGE;
}

export function useAdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const successTimeoutRef = useRef<number | null>(null);

  const clearSuccessTimeout = useCallback((): void => {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      clearSuccessTimeout();

      const [usersData, rolesData] = await Promise.all([
        apiAdminUsers(),
        apiAdminRoles(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (cause) {
      setError(buildLoadErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [clearSuccessTimeout]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      clearSuccessTimeout();
    };
  }, [clearSuccessTimeout]);

  const handleRoleChange = useCallback(
    async (userID: number, newRoleID: number): Promise<void> => {
      try {
        setUpdating(userID);
        setError(null);
        setSuccessMessage(null);
        clearSuccessTimeout();

        const updatedUser = await apiAdminUpdateRole(userID, newRoleID);

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userID === userID ? updatedUser : user,
          ),
        );

        setSuccessMessage(
          `Rôle de ${updatedUser.nickname} mis à jour avec succès`,
        );

        successTimeoutRef.current = window.setTimeout(() => {
          setSuccessMessage(null);
          successTimeoutRef.current = null;
        }, SUCCESS_MESSAGE_DURATION_MS);
      } catch (cause) {
        setError(buildUpdateErrorMessage(cause));
      } finally {
        setUpdating(null);
      }
    },
    [clearSuccessTimeout],
  );

  return {
    users,
    roles,
    loading,
    error,
    updating,
    successMessage,
    loadData,
    handleRoleChange,
  };
}
