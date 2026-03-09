import { vi } from "vitest";

export function createRouterMock() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    use: vi.fn(),
  };
}
