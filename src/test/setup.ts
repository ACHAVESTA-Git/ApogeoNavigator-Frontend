import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// jsdom no implementa matchMedia ni los observadores que usan los componentes.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

class ObservadorVacio {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.ResizeObserver ??= ObservadorVacio as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver ??= ObservadorVacio as unknown as typeof IntersectionObserver;
