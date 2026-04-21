import { Router, Request, Response } from 'express';
import { EdgeTtsService } from '../services/edgeTts.js';
import { createReadStream } from 'node:fs';

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

export function ttsRouter(tts: EdgeTtsService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text : '';
    const voice = typeof req.query.voice === 'string' && req.query.voice ? req.query.voice : DEFAULT_VOICE;
    if (text.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'text required' } });
    }

    try {
      const result = await tts.getOrGenerate(text, voice);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      createReadStream(result.path).pipe(res);
    } catch (err) {
      console.error('[tts] generation failed:', err);
      res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
    }
  });

  return router;
}
