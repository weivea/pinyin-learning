import { Preferences } from '@capacitor/preferences';

/** 默认缺失或解析失败时回退；strict 将读取错误上抛，避免覆盖已有进度。 */
export async function getJSON<T>(key: string, fallback: T, options?: { strict?: boolean }): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (value == null) return fallback;
    return JSON.parse(value) as T;
  } catch (error) {
    if (options?.strict) throw error;
    return fallback;
  }
}

/** JSON.stringify 后写入。 */
export async function setJSON(key: string, value: unknown): Promise<void> {
  await Preferences.set({ key, value: JSON.stringify(value) });
}

export async function remove(key: string): Promise<void> {
  await Preferences.remove({ key });
}
