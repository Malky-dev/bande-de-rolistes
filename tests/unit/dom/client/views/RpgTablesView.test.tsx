import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/rpgApi", () => ({
  apiGetRpgTable: vi.fn(),
  apiListRpgTables: vi.fn(),
  apiSignupRpg: vi.fn(),
  apiUnsignupRpg: vi.fn(),
}));

import RpgTablesView from "@/client/views/RpgTablesView";
import {
  formatDate,
  getMySignupBucket,
  getSelectedTableID,
  statusClass,
  statusLabel,
} from "@/client/views/rpgTablesView.helpers";

import {
  apiGetRpgTable,
  apiListRpgTables,
  apiSignupRpg,
  apiUnsignupRpg,
} from "@/api/rpgApi";

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

  it("rpg view helper functions derive labels, dates, selection, and signup buckets", () => {
    expect(formatDate("invalid")).toBe("invalid");
    expect(statusLabel("OPEN")).toBe("Inscription Ouverte");
    expect(statusLabel("CANCELLED")).toBe("Table Annul\u00e9e");
    expect(statusClass("CLOSED")).toBe("rpg-status rpg-status--closed");
    expect(getSelectedTableID(null, [])).toBeNull();
    expect(getSelectedTableID(null, [listItem])).toBe(10);
    expect(getSelectedTableID(42, [listItem])).toBe(42);
    expect(
      getMySignupBucket(
        {
          ...details,
          confirmed: [
            {
              userID: 5,
              nickname: "Neo",
              created_at: "2026-01-01T12:00:00.000Z",
            },
          ],
        },
        {
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
      ),
    ).toBe("CONFIRMED");
    expect(
      getMySignupBucket(
        {
          ...details,
          waitlist: [
            {
              userID: 5,
              nickname: "Neo",
              created_at: "2026-01-01T12:00:00.000Z",
            },
          ],
        },
        {
          userID: 5,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
      ),
    ).toBe("WAITLIST");
    expect(getMySignupBucket(details, null)).toBeNull();
  });

  it("shows the load error when the table list request fails", async () => {
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

  it("renders the empty state when there are no tables", async () => {
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
      expect(
        screen.getByText("Aucune table \u00e0 venir."),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("S\u00e9lectionne une table.")).toBeInTheDocument();
  });

  it("renders create and edit actions for permitted users", async () => {
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
      expect(screen.getByText("Cr\u00e9er une table")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Cr\u00e9er une table" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(onCreateTable).toHaveBeenCalledTimes(1);
    expect(onEditTable).toHaveBeenCalledWith(10);
  });

  it("shows login actions for guests and supports keyboard selection", async () => {
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

  it("supports selecting another table and redirects guests to discord", async () => {
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

  it("signs up for authenticated users", async () => {
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
    expect(
      screen.getByText("Inscription enregistr\u00e9e."),
    ).toBeInTheDocument();
  });

  it("signs out for authenticated users already in the confirmed list", async () => {
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
        screen.getByRole("button", { name: /Se d\u00e9sinscrire/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Se d\u00e9sinscrire/i }),
    );

    await waitFor(() => {
      expect(apiUnsignupRpg).toHaveBeenCalledWith(10);
    });
    expect(
      screen.getByText("D\u00e9sinscription effectu\u00e9e."),
    ).toBeInTheDocument();
  });

  it("shows action errors", async () => {
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

  it("shows generic fallback messages for non-Error detail and unsignup failures", async () => {
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
        screen.getByRole("button", { name: /Se d\u00e9sinscrire/i }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Se d\u00e9sinscrire/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("D\u00e9sinscription impossible"),
      ).toBeInTheDocument();
    });
  });

  it("renders closed tables and waitlist entries without signup actions", async () => {
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
      expect(screen.queryByText("Table Annul\u00e9e")).toBeNull();
      expect(screen.getByText("Inscription Ferm\u00e9e")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "S'inscrire" })).toBeNull();
    await waitFor(() => {
      expect(screen.getByText("Waiter")).toBeInTheDocument();
    });
  });

  it("renders cancelled tables without guest action buttons", async () => {
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
      expect(screen.getAllByText("Table Annul\u00e9e").length).toBeGreaterThan(
        0,
      );
    });

    expect(screen.queryByRole("button", { name: "Se connecter" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Discord/i })).toBeNull();
  });
});
