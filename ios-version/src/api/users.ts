import type { User } from '../types';
import { upsertByNickname, getById } from '../storage/userStore';

export function loginOrCreate(nickname: string, avatar: string): Promise<User> {
  return upsertByNickname(nickname, avatar);
}

export function getUser(id: number): Promise<User> {
  return getById(id).then(u => {
    if (!u) throw new Error('USER_NOT_FOUND');
    return u;
  });
}
