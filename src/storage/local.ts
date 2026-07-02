import { Preferences } from '@capacitor/preferences';

/** 读取并 JSON.parse；缺失或解析失败返回 fallback。 */
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    if (value == null) return fallback;
    return JSON.parse(value) as T;
  } catch {
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
