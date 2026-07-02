import { vi } from 'vitest';

// vi.mock 的工厂会被 Vitest 提升到文件顶部，无法引用普通闭包变量，
// 因此用 vi.hoisted 让 store 与工厂一起提升，保证两者在同一作用域。
const { store } = vi.hoisted(() => ({ store: new Map<string, string>() }));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({ value: store.get(key) ?? null }),
    set: async ({ key, value }: { key: string; value: string }) => { store.set(key, value); },
    remove: async ({ key }: { key: string }) => { store.delete(key); },
    clear: async () => { store.clear(); },
  },
}));

/** 内存版 @capacitor/preferences，行为对齐官方 API（value 为 string）。 */
export function installPreferencesMock() {
  return {
    reset: () => store.clear(),
    raw: store,
  };
}
