// 从 hanzi-writer-data（devDependency）抽取本模块 1000 字的笔顺数据，
// 打包成单个 public/hanzi-strokes.json（首次查看笔顺时一次性加载，离线可用）。
// 用法：node scripts/gen-strokes.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { VOLUMES } from './charlists.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const R = (p) => resolve(__dirname, p);
const DATA_DIR = R('../node_modules/hanzi-writer-data');

const chars = VOLUMES.flatMap((v) => v.chars);
const out = {};
const missing = [];
for (const ch of chars) {
  const f = resolve(DATA_DIR, `${ch}.json`);
  if (!existsSync(f)) {
    missing.push(ch);
    continue;
  }
  const { strokes, medians } = JSON.parse(readFileSync(f, 'utf8'));
  out[ch] = { strokes, medians };
}

writeFileSync(R('../public/hanzi-strokes.json'), JSON.stringify(out), 'utf8');

const bytes = Buffer.byteLength(JSON.stringify(out));
console.log(`笔顺数据：${Object.keys(out).length}/${chars.length} 字 -> public/hanzi-strokes.json (${(bytes / 1024 / 1024).toFixed(2)} MB)`);
console.log(`缺失 ${missing.length} 字：${missing.join('')}`);
