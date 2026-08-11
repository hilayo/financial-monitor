import '@testing-library/jest-dom';

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => '00000000-0000-4000-8000-000000000001',
    },
  });
}
