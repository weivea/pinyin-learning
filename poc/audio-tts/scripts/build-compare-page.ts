import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

interface CharsetEntry { idx: number; char: string; }
interface Charset { seed: number; generated_at: string; chars: CharsetEntry[]; }

const ENGINES = ['edge', 'sovits', 'coqui'] as const;
type Engine = typeof ENGINES[number];

function pad2(n: number): string { return n.toString().padStart(2, '0'); }

function detectAvailable(audioRoot: string): Record<Engine, boolean> {
  const out: Record<Engine, boolean> = { edge: false, sovits: false, coqui: false };
  for (const e of ENGINES) {
    const dir = join(audioRoot, e);
    out[e] = existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.mp3'));
  }
  return out;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const charset: Charset = JSON.parse(readFileSync(join(here, '..', 'charset.json'), 'utf8'));
  const audioRoot = join(here, '..', 'audio');
  const available = detectAvailable(audioRoot);

  const rows = charset.chars.map(({ idx, char }) => ({
    idx, char,
    files: Object.fromEntries(
      ENGINES.map((e) => [e, available[e] ? `audio/${e}/${pad2(idx)}-${char}.mp3` : null])
    ) as Record<Engine, string | null>,
  }));

  const html = renderHtml(rows, available);
  const out = join(here, '..', 'compare.html');
  writeFileSync(out, html, 'utf8');
  console.log(`Wrote ${out}. Available: ${ENGINES.filter((e) => available[e]).join(', ') || 'NONE'}`);
}

function renderHtml(
  rows: { idx: number; char: string; files: Record<Engine, string | null> }[],
  available: Record<Engine, boolean>,
): string {
  const data = JSON.stringify({ rows, available, engines: ENGINES });
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>字音 TTS 横评</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 20px auto; padding: 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; }
  th { background: #f5f5f5; }
  .star { cursor: pointer; font-size: 22px; color: #ccc; user-select: none; padding: 0 2px; }
  .star.on { color: #f5b301; }
  .char { font-size: 28px; font-weight: bold; }
  .toolbar { margin: 12px 0; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  button { padding: 6px 12px; cursor: pointer; }
  .skip { color: #999; font-style: italic; }
  .summary { margin-top: 20px; padding: 12px; background: #f5f5f5; border-radius: 4px; }
  audio { width: 180px; vertical-align: middle; }
</style>
</head>
<body>
<h1>字音 TTS 横评</h1>
<div class="toolbar">
  <label><input type="checkbox" id="blind" checked /> 盲听模式（按字打乱列顺序）</label>
  <button id="export">导出 CSV</button>
  <button id="clear">清空打分</button>
  <span id="status"></span>
</div>
<table>
  <thead>
    <tr>
      <th>序号</th><th>字</th>
      <th data-col="0">A</th>
      <th data-col="1">B</th>
      <th data-col="2">C</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>
<div class="summary" id="summary"></div>

<script>
const DATA = ${data};
const STORAGE_KEY = 'tts-poc-scores-v1';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffleSeeded(arr, seed) {
  const rng = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadScores() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}
function saveScores(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

let scores = loadScores();
const blindCheckbox = document.getElementById('blind');

function colOrderFor(idx) {
  if (blindCheckbox.checked) return shuffleSeeded(DATA.engines, idx);
  return [...DATA.engines];
}

function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  for (const row of DATA.rows) {
    const order = colOrderFor(row.idx);
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + String(row.idx).padStart(2, '0') + '</td>'
      + '<td class="char">' + row.char + '</td>';
    for (const eng of order) {
      const td = document.createElement('td');
      const file = row.files[eng];
      if (!file) {
        td.innerHTML = '<span class="skip">未生成</span>';
      } else {
        const audio = '<audio controls preload="none" src="' + file + '"></audio>';
        const stars = [1,2,3,4,5].map((n) => {
          const cur = (scores[row.idx] || {})[eng] || 0;
          return '<span class="star' + (n <= cur ? ' on' : '') + '" data-idx="' + row.idx + '" data-eng="' + eng + '" data-n="' + n + '">★</span>';
        }).join('');
        td.innerHTML = audio + '<br/>' + stars;
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  bindStars();
  renderSummary();
}

function bindStars() {
  document.querySelectorAll('.star').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data-idx');
      const eng = el.getAttribute('data-eng');
      const n = Number(el.getAttribute('data-n'));
      scores[idx] = scores[idx] || {};
      scores[idx][eng] = scores[idx][eng] === n ? 0 : n;
      saveScores(scores);
      render();
    });
  });
}

function renderSummary() {
  const totals = {}; const counts = {};
  for (const e of DATA.engines) { totals[e] = 0; counts[e] = 0; }
  for (const row of DATA.rows) {
    const r = scores[row.idx] || {};
    for (const e of DATA.engines) {
      if (r[e] && row.files[e]) { totals[e] += r[e]; counts[e]++; }
    }
  }
  const parts = DATA.engines.map((e) => {
    if (!DATA.available[e]) return e + ': N/A';
    const avg = counts[e] ? (totals[e] / counts[e]).toFixed(2) : '-';
    return e + ' 平均 ' + avg + ' (' + counts[e] + '/' + DATA.rows.length + ')';
  });
  document.getElementById('summary').textContent = '汇总：' + parts.join(' | ');
}

document.getElementById('export').addEventListener('click', () => {
  const lines = ['idx,char,edge_score,sovits_score,coqui_score,notes'];
  for (const row of DATA.rows) {
    const r = scores[row.idx] || {};
    lines.push([
      row.idx, row.char,
      r.edge || '', r.sovits || '', r.coqui || '', '',
    ].join(','));
  }
  const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'scores-' + Date.now() + '.csv';
  a.click(); URL.revokeObjectURL(url);
});

document.getElementById('clear').addEventListener('click', () => {
  if (!confirm('清空所有打分？')) return;
  scores = {}; saveScores(scores); render();
});

blindCheckbox.addEventListener('change', render);

render();
</script>
</body>
</html>
`;
}

main();
