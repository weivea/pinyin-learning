import { describe, it, expect, beforeEach, vi } from 'vitest';
import { installPreferencesMock } from '../test-mocks/capacitor';

const mock = installPreferencesMock();

import { upsertByNickname, getById } from './userStore';

describe('userStore', () => {
  beforeEach(() => { mock.reset(); vi.clearAllMocks(); });

  it('creates a new user with id 1 then 2', async () => {
    const a = await upsertByNickname('小明', '🐰');
    const b = await upsertByNickname('小红', '🐱');
    expect(a).toMatchObject({ id: 1, nickname: '小明', avatar: '🐰' });
    expect(b).toMatchObject({ id: 2, nickname: '小红', avatar: '🐱' });
  });

  it('same nickname returns the same account (id stable)', async () => {
    const first = await upsertByNickname('小明', '🐰');
    const again = await upsertByNickname('小明', '🐶');
    expect(again.id).toBe(first.id);
  });

  it('getById returns the stored user or null', async () => {
    const a = await upsertByNickname('小明', '🐰');
    expect(await getById(a.id)).toMatchObject({ id: a.id, nickname: '小明' });
    expect(await getById(999)).toBeNull();
  });
});
