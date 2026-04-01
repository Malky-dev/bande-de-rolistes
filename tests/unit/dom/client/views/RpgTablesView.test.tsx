import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RpgTablesView from "@/client/views/RpgTablesView";
import {
  formatDate,
  getSelectedTableID,
  statusClass,
  statusLabel,
} from "@/client/views/rpgTablesView.helpers";
import {
  apiGetRpgTable,
  apiListRpgTables,
  apiSignupRpg,
  apiUnsignupRpg,
} from "@/api/rpg";

vi.mock("@/api/rpg", () => ({
  apiGetRpgTable: vi.fn(),
  apiListRpgTables: vi.fn(),
  apiSignupRpg: vi.fn(),
  apiUnsignupRpg: vi.fn(),
}));

const listItem = {
  eventID: 10,
  eventDate: "2026-01-01T12:00:00.000Z",
  dungeonMaster: { userID: 7, nickname: "DM" },
  location: "Paris",
  game: "D&D",
  comments: null,
  status: "OPEN" as const,
  maxPlayers: 6,
};

const details = {
  eventID: 10,
  eventDate: "2026-01-01T12:00:00.000Z",
  dungeonMaster: { userID: 7, nickname: "DM" },
  location: "Paris",
  game: "D&D",
  comments: "Bring snacks",
  status: "OPEN" as const,
  maxPlayers: 6,
  confirmedCap: 6,
  confirmed: [],
  waitlist: [],
};

describe("RpgTablesView", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("calcule les libellés, les dates et la sélection de la vue JDR", () => {
    expect(formatDate("invalid")).toBe("invalid");
    expect(statusLabel("OPEN")).toBe("Inscription Ouverte");
    expect(statusLabel("CANCELLED")).toBe("Table Annulée");
    expect(statusClass("CLOSED")).toBe("rpg-status rpg-status--closed");
    expect(getSelectedTableID(null, [])).toBeNull();
    expect(getSelectedTableID(null, [listItem])).toBe(10);
    expect(getSelectedTableID(42, [listItem])).toBe(42);
  });

  it("affiche l’erreur de chargement quand la requête de liste des tables échoue", async () => {
    vi.mocked(apiListRpgTables).mockRejectedValue(new Error("Load failed"));

    render(
      <RpgTablesView
        session={null}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });
  });

  it("affiche l’état vide quand aucune table n’est disponible", async () => {
    vi.mocked(apiListRpgTables).mockResolvedValue([]);

    render(
      <RpgTablesView
        session={null}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Aucune table à venir.")).toBeInTheDocument();
    });
    expect(screen.getByText("Sélectionne une table.")).toBeInTheDocument();
  });

  it("affiche les actions de création et de modification pour les utilisateurs autorisés", async () => {
    const onCreateTable = vi.fn();
    const onEditTable = vi.fn();
    vi.mocked(apiListRpgTables).mockResolvedValue([listItem]);
    vi.mocked(apiGetRpgTable).mockResolvedValue(details);

    render(
      <RpgTablesView
        session={{
          userID: 7,
          nickname: "DM",
          roleID: 3,
          role: "mj",
          isVerified: true,
        }}
        onCreateTable={onCreateTable}
        onEditTable={onEditTable}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Créer une table")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Créer une table" }));
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(onCreateTable).toHaveBeenCalledTimes(1);
    expect(onEditTable).toHaveBeenCalledWith(10);
  });

  it("affiche les actions de connexion pour les invités et permet la sélection au clavier", async () => {
    const onLogin = vi.fn();
    vi.mocked(apiListRpgTables).mockResolvedValue([
      { ...listItem, eventDate: "invalid" },
    ]);
    vi.mocked(apiGetRpgTable).mockResolvedValue(details);

    render(
      <RpgTablesView
        session={null}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={onLogin}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("D&D")).toBeInTheDocument();
    });

    fireEvent.keyDown(screen.getAllByRole("button")[0], { key: "Enter" });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Se connecter" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });

  it("permet de sélectionner une autre table et redirige les invités vers Discord", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost/" },
      writable: true,
    });

    vi.mocked(apiListRpgTables).mockResolvedValue([
      listItem,
      {
        ...listItem,
        eventID: 11,
        game: "Pathfinder",
        dungeonMaster: { userID: 8, nickname: "Other DM" },
      },
    ]);
    vi.mocked(apiGetRpgTable)
      .mockResolvedValueOnce(details)
      .mockResolvedValueOnce({
        ...details,
        eventID: 11,
        game: "Pathfinder",
        dungeonMaster: { userID: 8, nickname: "Other DM" },
      });

    render(
      <RpgTablesView
        session={null}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/PATHFINDER/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() => {
      expect(screen.getByText(/Other DM/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Discord/i }));

    expect(window.location.href).toBe("/api/discord/init");
  });

  it("inscrit les utilisateurs authentifiés", async () => {
    vi.mocked(apiListRpgTables)
      .mockResolvedValueOnce([listItem])
      .mockResolvedValueOnce([listItem]);
    vi.mocked(apiGetRpgTable)
      .mockResolvedValueOnce(details)
      .mockResolvedValueOnce(details);
    vi.mocked(apiSignupRpg).mockResolvedValue();

    render(
      <RpgTablesView
        session={{
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "S'inscrire" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "S'inscrire" }));

    await waitFor(() => {
      expect(apiSignupRpg).toHaveBeenCalledWith(10);
    });
    expect(screen.getByText("Inscription enregistrée.")).toBeInTheDocument();
  });

  it("désinscrit les utilisateurs authentifiés déjà présents dans la liste confirmée", async () => {
    vi.mocked(apiListRpgTables)
      .mockResolvedValueOnce([listItem])
      .mockResolvedValueOnce([listItem]);
    vi.mocked(apiGetRpgTable)
      .mockResolvedValueOnce({
        ...details,
        confirmed: [
          {
            userID: 5,
            nickname: "Neo",
            created_at: "2026-01-01T12:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce(details);
    vi.mocked(apiUnsignupRpg).mockResolvedValue();

    render(
      <RpgTablesView
        session={{
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Se désinscrire/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Se désinscrire/i }));

    await waitFor(() => {
      expect(apiUnsignupRpg).toHaveBeenCalledWith(10);
    });
    expect(screen.getByText("Désinscription effectuée.")).toBeInTheDocument();
  });

  it("affiche les erreurs d’action", async () => {
    vi.mocked(apiListRpgTables).mockResolvedValue([listItem]);
    vi.mocked(apiGetRpgTable).mockResolvedValue(details);
    vi.mocked(apiSignupRpg).mockRejectedValue(new Error("Signup failed"));

    render(
      <RpgTablesView
        session={{
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Bring snacks")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "S'inscrire" }));

    await waitFor(() => {
      expect(screen.getByText("Signup failed")).toBeInTheDocument();
    });
  });

  it("affiche les messages génériques de secours pour les échecs non Error de détail et de désinscription", async () => {
    vi.mocked(apiListRpgTables).mockResolvedValue([
      listItem,
      {
        ...listItem,
        eventID: 11,
        game: "Pathfinder",
        dungeonMaster: { userID: 8, nickname: "Other DM" },
      },
    ]);
    vi.mocked(apiGetRpgTable)
      .mockResolvedValueOnce(details)
      .mockRejectedValueOnce("boom")
      .mockResolvedValueOnce({
        ...details,
        confirmed: [
          {
            userID: 5,
            nickname: "Neo",
            created_at: "2026-01-01T12:00:00.000Z",
          },
        ],
      });
    vi.mocked(apiUnsignupRpg).mockRejectedValueOnce("boom");

    render(
      <RpgTablesView
        session={{
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Bring snacks")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger la table"),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Se désinscrire/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Se désinscrire/i }));

    await waitFor(() => {
      expect(screen.getByText("Désinscription impossible")).toBeInTheDocument();
    });
  });

  it("affiche les tables fermées et les entrées en liste d’attente sans action d’inscription", async () => {
    vi.mocked(apiListRpgTables).mockResolvedValue([
      { ...listItem, status: "CLOSED" },
    ]);
    vi.mocked(apiGetRpgTable).mockResolvedValue({
      ...details,
      status: "CLOSED",
      waitlist: [
        {
          userID: 6,
          nickname: "Waiter",
          created_at: "2026-01-01T12:00:00.000Z",
        },
      ],
    });

    render(
      <RpgTablesView
        session={{
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("Table Annulée")).toBeNull();
      expect(screen.getByText("Inscription Fermée")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "S'inscrire" })).toBeNull();
    await waitFor(() => {
      expect(screen.getByText("Waiter")).toBeInTheDocument();
    });
  });

  it("affiche les tables annulées sans boutons d’action invité", async () => {
    vi.mocked(apiListRpgTables).mockResolvedValue([
      { ...listItem, status: "CANCELLED" },
    ]);
    vi.mocked(apiGetRpgTable).mockResolvedValue({
      ...details,
      status: "CANCELLED",
    });

    render(
      <RpgTablesView
        session={null}
        onCreateTable={vi.fn()}
        onEditTable={vi.fn()}
        onLogin={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Table Annulée").length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole("button", { name: "Se connecter" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Discord/i })).toBeNull();
  });
});
