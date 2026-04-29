import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = 42;

// 常用字池：刻意覆盖单韵母、多音字、轻声字、卷舌音、儿化基础字
const POOL = [
  '妈','马','骂','麻','爸','白','百','北','本','不',
  '波','播','破','婆','泼','啊','爱','安','按','岸',
  '欧','偶','藕','怕','拍','排','派','跑','炮','陪',
  '是','时','十','使','市','师','石','史','水','睡',
  '吃','车','尺','齿','池','茶','长','常','场','唱',
  '日','人','认','热','软','弱','若','然','让','绕',
  '知','只','纸','直','志','中','种','重','住','主',
  '行','银','应','英','影','音','因','一','以','已',
  '的','了','吗','呢','吧','着','过','地','得','着',
  '儿','二','耳','而','发','法','飞','分','风','服',
  '高','哥','给','跟','工','公','共','古','果','过',
  '好','和','河','黑','很','后','花','话','回','或',
];

function mulberry32(a: number) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function pickChars(pool: string[], n: number, seed: number): string[] {
  const rng = mulberry32(seed);
  const arr = [...new Set(pool)];
  // Fisher-Yates with seeded RNG
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

function main() {
  const chars = pickChars(POOL, 20, SEED);
  const charset = {
    seed: SEED,
    generated_at: new Date().toISOString(),
    chars: chars.map((char, i) => ({ idx: i + 1, char })),
  };
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(here, '..', 'charset.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(charset, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out} with ${chars.length} chars: ${chars.join(' ')}`);
}

main();
