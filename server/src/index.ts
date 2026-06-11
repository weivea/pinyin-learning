import { createApp } from './app.js';
import { createDb } from './db/connection.js';
import { AzureTtsService, createAzureGenerator } from './services/azureTts.js';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// 从 cwd 逐级向上查找 .env 并加载（Node 原生，无需 dotenv）。
// 服务器以 server/ 为 cwd 运行，向上找可同时兼容 server/.env 与仓库根 .env。
function loadEnvUpwards(): void {
  let dir = resolve('.');
  while (true) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      try {
        process.loadEnvFile(candidate);
        console.log(`[server] loaded env from ${candidate}`);
      } catch {
        // 文件存在但解析失败时忽略，凭据可由真实环境变量提供。
      }
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}
loadEnvUpwards();

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/pinyin.db';
const CACHE_DIR = process.env.TTS_CACHE_DIR || resolve('./cache');
const PINYIN_AUDIO_DIR = process.env.PINYIN_AUDIO_DIR || resolve('./audio/pinyin');

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT;

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);

const azureConfigured = Boolean(AZURE_SPEECH_KEY && AZURE_SPEECH_ENDPOINT);
if (!azureConfigured) {
  console.warn(
    '[server] Azure Speech 未配置（缺少 AZURE_SPEECH_KEY / AZURE_SPEECH_ENDPOINT）。' +
      ' TTS backup 将不可用，前端会回退到内置拼音音频。参考 .env.example 配置。',
  );
}
const tts = new AzureTtsService({
  cacheDir: CACHE_DIR,
  generator: azureConfigured
    ? createAzureGenerator({ key: AZURE_SPEECH_KEY!, endpoint: AZURE_SPEECH_ENDPOINT! })
    : undefined,
});
const app = createApp({ db, tts, pinyinAudioDir: PINYIN_AUDIO_DIR });

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
