import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ForbiddenView from "@/client/views/ForbiddenView";

describe("ForbiddenView", () => {
  it("renders the default message and calls onBackHome", () => {
    const onBackHome = vi.fn();

    render(<ForbiddenView onBackHome={onBackHome} />);

    expect(screen.getByText("Acc\u00e8s refus\u00e9")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vous devez \u00eatre administrateur pour acc\u00e9der \u00e0 cette page.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retour/i }));

    expect(onBackHome).toHaveBeenCalledTimes(1);
  });

  it("renders custom title and message", () => {
    render(
      <ForbiddenView
        title="Connexion requise"
        message="Veuillez vous connecter."
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    expect(screen.getByText("Veuillez vous connecter.")).toBeInTheDocument();
  });
});
