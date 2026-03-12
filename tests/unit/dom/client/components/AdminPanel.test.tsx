import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/authApi", () => ({
  apiAdminRoles: vi.fn(),
  apiAdminUpdateRole: vi.fn(),
  apiAdminUsers: vi.fn(),
}));

import AdminPanel from "@/client/components/AdminPanel";
import {
  apiAdminRoles,
  apiAdminUpdateRole,
  apiAdminUsers,
} from "@/api/authApi";

describe("AdminPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("charge et affiche les utilisateurs et les rôles", async () => {
    vi.mocked(apiAdminUsers).mockResolvedValue([
      {
        userID: 1,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
    vi.mocked(apiAdminRoles).mockResolvedValue([
      { roleID: 1, roleLabel: "admin" },
      { roleID: 2, roleLabel: "organisator" },
    ]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Neo")).toBeInTheDocument();
    });
    expect(screen.getAllByText("admin")).toHaveLength(2);
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("affiche le message de reconnexion en cas d’échec d’autorisation", async () => {
    vi.mocked(apiAdminUsers).mockRejectedValue(new Error("FORBIDDEN"));
    vi.mocked(apiAdminRoles).mockResolvedValue([]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText(/Veuillez vous reconnecter/i),
      ).toBeInTheDocument();
    });
  });

  it("affiche les messages génériques de secours pour les échecs non Error", async () => {
    vi.mocked(apiAdminUsers).mockRejectedValueOnce("boom");
    vi.mocked(apiAdminRoles).mockResolvedValueOnce([]);

    const { unmount } = render(<AdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Erreur lors du chargement des données"),
      ).toBeInTheDocument();
    });

    unmount();

    vi.mocked(apiAdminUsers).mockResolvedValueOnce([
      {
        userID: 1,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
    vi.mocked(apiAdminRoles).mockResolvedValueOnce([
      { roleID: 1, roleLabel: "admin" },
      { roleID: 2, roleLabel: "organisator" },
    ]);
    vi.mocked(apiAdminUpdateRole).mockRejectedValueOnce("boom");

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "2" },
    });

    await waitFor(() => {
      expect(
        screen.getByText("Erreur lors de la modification du rôle"),
      ).toBeInTheDocument();
    });
  });

  it("affiche l’état vide quand aucun utilisateur n’est présent", async () => {
    vi.mocked(apiAdminUsers).mockResolvedValue([]);
    vi.mocked(apiAdminRoles).mockResolvedValue([]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Aucun utilisateur trouvé")).toBeInTheDocument();
    });
  });

  it("met à jour le rôle d’un utilisateur", async () => {
    vi.mocked(apiAdminUsers).mockResolvedValue([
      {
        userID: 1,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: false,
      },
      {
        userID: 2,
        nickname: "Trinity",
        email: "trinity@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
    vi.mocked(apiAdminRoles).mockResolvedValue([
      { roleID: 1, roleLabel: "admin" },
      { roleID: 2, roleLabel: "organisator" },
    ]);
    vi.mocked(apiAdminUpdateRole).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      roleID: 2,
      roleLabel: "organisator",
      isVerified: false,
    });

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "2" },
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Rôle de Neo mis à jour avec succès/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Trinity")).toBeInTheDocument();
  });

  it("affiche l’erreur de mise à jour et permet de recharger", async () => {
    vi.mocked(apiAdminUsers).mockResolvedValue([
      {
        userID: 1,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
    vi.mocked(apiAdminRoles).mockResolvedValue([
      { roleID: 1, roleLabel: "admin" },
      { roleID: 2, roleLabel: "organisator" },
    ]);
    vi.mocked(apiAdminUpdateRole).mockRejectedValue(new Error("Update failed"));

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "2" },
    });

    await waitFor(() => {
      expect(screen.getByText("Update failed")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    await waitFor(() => {
      expect(apiAdminUsers).toHaveBeenCalledTimes(2);
    });
  });
});
