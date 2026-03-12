import { describe, expect, it, vi } from "vitest";

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({
  render: renderMock,
}));

vi.mock("react-dom/client", () => ({
  createRoot: createRootMock,
}));

vi.mock("@/client/App", () => ({
  default: () => <div>App</div>,
}));

describe("point d’entrée de client", () => {
  it("monte l’application dans l’élément root", async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import("@/client/main");

    expect(createRootMock).toHaveBeenCalledWith(
      document.getElementById("root"),
    );
    expect(renderMock).toHaveBeenCalledTimes(1);
  });
});
