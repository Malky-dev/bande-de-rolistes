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

  it("loads and renders users and roles", async () => {
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
    expect(screen.getByText("\u2713")).toBeInTheDocument();
  });

  it("shows the reconnect message for authorization failures", async () => {
    vi.mocked(apiAdminUsers).mockRejectedValue(new Error("FORBIDDEN"));
    vi.mocked(apiAdminRoles).mockResolvedValue([]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText(/Veuillez vous reconnecter/i),
      ).toBeInTheDocument();
    });
  });

  it("shows generic fallback messages for non-Error failures", async () => {
    vi.mocked(apiAdminUsers).mockRejectedValueOnce("boom");
    vi.mocked(apiAdminRoles).mockResolvedValueOnce([]);

    const { unmount } = render(<AdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Erreur lors du chargement des donn\u00e9es"),
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
        screen.getByText("Erreur lors de la modification du r\u00f4le"),
      ).toBeInTheDocument();
    });
  });

  it("renders the empty state when there are no users", async () => {
    vi.mocked(apiAdminUsers).mockResolvedValue([]);
    vi.mocked(apiAdminRoles).mockResolvedValue([]);

    render(<AdminPanel />);

    await waitFor(() => {
      expect(
        screen.getByText("Aucun utilisateur trouv\u00e9"),
      ).toBeInTheDocument();
    });
  });

  it("updates a user role", async () => {
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
        screen.getByText(/R\u00f4le de Neo mis \u00e0 jour avec succ\u00e8s/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Trinity")).toBeInTheDocument();
  });

  it("shows the update error and supports reload", async () => {
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
