import { createApp } from './app.js';
import { createDb } from './db/connection.js';
import { EdgeTtsService } from './services/edgeTts.js';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/pinyin.db';
const CACHE_DIR = process.env.TTS_CACHE_DIR || resolve('./cache');
const PINYIN_AUDIO_DIR = process.env.PINYIN_AUDIO_DIR || resolve('./audio/pinyin');

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);
const tts = new EdgeTtsService({ cacheDir: CACHE_DIR });
const app = createApp({ db, tts, pinyinAudioDir: PINYIN_AUDIO_DIR });

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
