import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminView from "@/client/views/AdminView";

vi.mock("@/client/components/AdminPanel", () => ({
  default: () => <div>AdminPanel</div>,
}));

vi.mock("@/client/views/ForbiddenView", () => ({
  default: ({ onBackHome }: { onBackHome: () => void }) => (
    <button onClick={onBackHome}>ForbiddenView</button>
  ),
}));

describe("AdminView", () => {
  it("renders the forbidden view when the session is not admin", () => {
    render(
      <AdminView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 2,
          role: "member",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "ForbiddenView" }),
    ).toBeInTheDocument();
  });

  it("renders the admin panel for an admin session", () => {
    render(
      <AdminView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("AdminPanel")).toBeInTheDocument();
  });
});
