import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Las pruebas fijan los textos en español (jsdom se presenta como en-US y la app elegiría inglés). La clave va
// escrita aquí, sin importar `lib/idioma`: importarlo resolvería el idioma antes de poder fijarlo.
window.localStorage.setItem("apogeo.idioma", "es");

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
