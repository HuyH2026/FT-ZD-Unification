import '@testing-library/jest-dom/vitest'

// jsdom does not implement ResizeObserver, which recharts-based widgets use to
// measure their container. Provide a no-op stub so components that observe size
// can mount in tests (real browsers supply the API natively).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
