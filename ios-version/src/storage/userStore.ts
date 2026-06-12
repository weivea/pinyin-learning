import type { User } from '../types';
import { getJSON, setJSON } from './local';

const USERS_KEY = 'pinyin:users';
const SEQ_KEY = 'pinyin:users:seq';

async function readUsers(): Promise<User[]> {
  return getJSON<User[]>(USERS_KEY, []);
}

export async function upsertByNickname(nickname: string, avatar: string): Promise<User> {
  const users = await readUsers();
  const existing = users.find(u => u.nickname === nickname);
  if (existing) return existing;

  const nextId = (await getJSON<number>(SEQ_KEY, 0)) + 1;
  const user: User = { id: nextId, nickname, avatar };
  users.push(user);
  await setJSON(USERS_KEY, users);
  await setJSON(SEQ_KEY, nextId);
  return user;
}

export async function getById(id: number): Promise<User | null> {
  const users = await readUsers();
  return users.find(u => u.id === id) ?? null;
}
