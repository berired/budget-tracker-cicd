import '@testing-library/jest-dom/vitest';

// Newer Node versions ship an experimental global localStorage that can shadow
// jsdom's and be unusable. Provide a simple in-memory implementation if needed.
if (typeof globalThis.localStorage?.clear !== 'function') {
  const store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  });
}
