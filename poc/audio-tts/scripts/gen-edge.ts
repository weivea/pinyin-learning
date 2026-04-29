import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VOICE = 'zh-CN-XiaoxiaoNeural';

interface CharsetEntry { idx: number; char: string; }
interface Charset { seed: number; generated_at: string; chars: CharsetEntry[]; }

async function synth(text: string): Promise<Buffer> {
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const { audioStream } = await tts.toStream(text);
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on('data', (c: Buffer) => chunks.push(c));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', reject);
  });
}

function pad2(n: number): string { return n.toString().padStart(2, '0'); }

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const charsetPath = join(here, '..', 'charset.json');
  const outDir = join(here, '..', 'audio', 'edge');
  mkdirSync(outDir, { recursive: true });
  const charset: Charset = JSON.parse(readFileSync(charsetPath, 'utf8'));

  for (const { idx, char } of charset.chars) {
    const fname = `${pad2(idx)}-${char}.mp3`;
    const out = join(outDir, fname);
    if (existsSync(out)) {
      console.log(`SKIP ${fname} (exists)`);
      continue;
    }
    console.log(`GEN  ${fname}`);
    const buf = await synth(char);
    if (!buf || buf.length === 0) throw new Error(`empty audio for ${char}`);
    writeFileSync(out, buf);
  }
  console.log(`Done. ${charset.chars.length} files in ${outDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
