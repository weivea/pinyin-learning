import { Router, Request, Response } from 'express';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * 静态拼音音节音频路由。
 * 文件来源 du.hanyupinyin.cn，命名形如 a1.mp3 / ve3.mp3 / zhi1.mp3 / b.mp3。
 */
export function pinyinAudioRouter(audioDir: string): Router {
  const router = Router();
  const root = resolve(audioDir);

  router.get('/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename;
    // 仅允许 [a-z]+ 后跟可选 1-4 + .mp3，挡掉目录穿越和奇异字符
    if (!/^[a-z]+[1-4]?\.mp3$/.test(filename)) {
      return res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'invalid filename' } });
    }
    const path = join(root, filename);
    // 二次校验解析后路径仍在 root 内
    if (!path.startsWith(root + '/') && path !== root) {
      return res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'invalid path' } });
    }
    if (!existsSync(path)) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'audio not found' } });
    }
    const size = statSync(path).size;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(size));
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    createReadStream(path).pipe(res);
  });

  return router;
}
