import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService.js';
import type { DB } from '../db/connection.js';

export function usersRouter(db: DB): Router {
  const router = Router();
  const service = new UserService(db);

  router.post('/', (req: Request, res: Response) => {
    const { nickname, avatar } = req.body ?? {};
    if (typeof nickname !== 'string' || nickname.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'nickname required' } });
    }
    const user = service.upsertByNickname(nickname.trim(), typeof avatar === 'string' ? avatar : '');
    res.json(user);
  });

  router.get('/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'id must be number' } });
    }
    const user = service.getById(id);
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'user not found' } });
    res.json(user);
  });

  return router;
}
