import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { getJSON, setJSON, remove } from './local';

describe('storage/local', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('returns fallback when key missing', async () => {
    expect(await getJSON('missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('round-trips an object', async () => {
    await setJSON('k', { hello: 'world', n: 2 });
    expect(await getJSON('k', null)).toEqual({ hello: 'world', n: 2 });
  });

  it('returns fallback on corrupt JSON', async () => {
    mock.raw.set('bad', '{not json');
    expect(await getJSON('bad', 'fallback')).toBe('fallback');
  });

  it('remove deletes the key', async () => {
    await setJSON('k', 1);
    await remove('k');
    expect(await getJSON('k', 'gone')).toBe('gone');
  });
});
