import { createApp } from './app.js';
import { createDb } from './db/connection.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PORT = Number(process.env.PORT) || 3001;
const DB_PATH = process.env.DB_PATH || './data/pinyin.db';

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);
const app = createApp({ db });

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
