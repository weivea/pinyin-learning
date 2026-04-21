import { Router, Request, Response } from 'express';
import { EdgeTtsService, TtsRequest } from '../services/edgeTts.js';
import { createReadStream } from 'node:fs';

const DEFAULT_VOICE = 'zh-CN-XiaoxiaoNeural';

function parseTone(raw: unknown): 1 | 2 | 3 | 4 | null {
  if (typeof raw !== 'string' || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 4) return null;
  return n as 1 | 2 | 3 | 4;
}

export function ttsRouter(tts: EdgeTtsService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const text = typeof req.query.text === 'string' ? req.query.text : '';
    const voice = typeof req.query.voice === 'string' && req.query.voice ? req.query.voice : DEFAULT_VOICE;
    const pinyin = typeof req.query.pinyin === 'string' && req.query.pinyin ? req.query.pinyin : undefined;
    const toneRaw = req.query.tone;

    if (text.trim() === '') {
      return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'text required' } });
    }

    let tone: 1 | 2 | 3 | 4 | undefined;
    if (pinyin !== undefined || toneRaw !== undefined) {
      const parsed = parseTone(toneRaw);
      if (pinyin !== undefined && parsed === null) {
        return res.status(400).json({
          error: { code: 'INVALID_TONE', message: 'tone must be 1-4 when pinyin provided' },
        });
      }
      if (parsed === null && toneRaw !== undefined) {
        return res.status(400).json({
          error: { code: 'INVALID_TONE', message: 'tone must be 1-4' },
        });
      }
      tone = parsed ?? undefined;
    }

    const baseReq: TtsRequest = { text, voice };
    const phonemeReq: TtsRequest = pinyin && tone ? { text, voice, pinyin, tone } : baseReq;
    const phonemeMode = Boolean(pinyin && tone);

    let result;
    let mode: 'phoneme' | 'text' | 'fallback-text';
    try {
      result = await tts.getOrGenerate(phonemeReq);
      mode = phonemeMode ? 'phoneme' : 'text';
    } catch (err) {
      if (!phonemeMode) {
        console.error('[tts] generation failed:', err);
        return res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
      }
      console.warn('[tts] phoneme failed, falling back to text:', err);
      try {
        result = await tts.getOrGenerate(baseReq);
        mode = 'fallback-text';
      } catch (err2) {
        console.error('[tts] fallback also failed:', err2);
        return res.status(503).json({ error: { code: 'TTS_UNAVAILABLE', message: 'TTS service failed' } });
      }
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('X-TTS-Mode', mode);
    res.setHeader('X-TTS-Cache', result.fromCache ? 'hit' : 'miss');
    createReadStream(result.path).pipe(res);
  });

  return router;
}
