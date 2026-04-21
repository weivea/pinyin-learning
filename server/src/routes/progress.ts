import { Router, Request, Response } from 'express';
import { ProgressService } from '../services/progressService.js';
import type { DB } from '../db/connection.js';

export function progressRouter(db: DB): Router {
  const router = Router({ mergeParams: true });
  const service = new ProgressService(db);

  router.get('/:userId', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'bad userId' } });
    res.json(service.getProgress(userId));
  });

  router.post('/:userId/pinyin', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const { pinyin } = req.body ?? {};
    if (!Number.isFinite(userId) || typeof pinyin !== 'string' || pinyin === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'userId or pinyin missing' } });
    }
    res.json(service.recordPinyinLearned(userId, pinyin));
  });

  router.post('/:userId/game', (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const { gameType, score, stars } = req.body ?? {};
    if (!Number.isFinite(userId) || !ProgressService.isValidGameType(gameType) ||
        !Number.isFinite(score) || !Number.isFinite(stars)) {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'bad payload' } });
    }
    res.json(service.recordGameScore(userId, gameType, score, stars));
  });

  return router;
}
