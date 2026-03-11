import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import QuoteView from "@/client/views/QuoteView";

vi.mock("@/client/components/QuotesPanel", () => ({
  default: () => <div>QuotesPanel</div>,
}));

vi.mock("@/client/views/ForbiddenView", () => ({
  default: ({
    title,
    message,
  }: {
    title: string;
    message: string;
    onBackHome: () => void;
  }) => (
    <div>
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

describe("QuoteView", () => {
  it("renders the login-required forbidden view when there is no session", () => {
    render(<QuoteView session={null} onBackHome={vi.fn()} />);

    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Vous devez \u00eatre connect\u00e9 pour g\u00e9rer les citations/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the forbidden view when the role cannot manage quotes", () => {
    render(
      <QuoteView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("Acc\u00e8s interdit")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Seuls les admins et organisateurs peuvent g\u00e9rer les citations/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the quotes panel for admin and organisator sessions", () => {
    const { rerender } = render(
      <QuoteView
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

    expect(screen.getByText("QuotesPanel")).toBeInTheDocument();

    rerender(
      <QuoteView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 2,
          role: "organisator",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("QuotesPanel")).toBeInTheDocument();
  });
});
