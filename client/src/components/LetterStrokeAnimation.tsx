import { useEffect, useRef, useState } from 'react';
import { getStrokes } from '../data/letterStrokes';

interface Props {
  upper: string;
  lower: string;
}

/** 书写速度：viewBox 单位/秒。越小越慢。 */
const SPEED = 46;
const MIN_DUR = 700;
const MAX_DUR = 1700;
/** 每一笔之间的停顿。 */
const GAP_MS = 320;

const GUIDE = '#efe3ba';
const GHOST = '#ffe3b0';
const INK = '#fb8500';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function Panel({ char, label }: { char: string; label: string }) {
  const strokes = getStrokes(char);
  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        viewBox="0 0 100 100"
        width={148}
        height={148}
        role="img"
        aria-label={`${label} ${char} 书写演示`}
        data-glyph
        style={{ background: '#fffdf7', borderRadius: 20, border: '2px dashed #ffd166' }}
      >
        {/* 四线格 */}
        <line x1="50" y1="8" x2="50" y2="92" stroke={GUIDE} strokeWidth="1" strokeDasharray="4 4" />
        <line x1="8" y1="16" x2="92" y2="16" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 5" />
        <line x1="8" y1="46" x2="92" y2="46" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 5" />
        <line x1="8" y1="80" x2="92" y2="80" stroke={GUIDE} strokeWidth="1.2" />

        {/* 浅色底样：与笔画同一路径，保证与书写完全对齐 */}
        {strokes.map((d, i) => (
          <path
            key={`ghost-${i}`}
            d={d}
            fill="none"
            stroke={GHOST}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* 书写层：由 JS 逐笔揭示 */}
        {strokes.map((d, i) => (
          <path
            key={`ink-${i}`}
            className="ink-path"
            data-ink
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
          />
        ))}

        {/* 笔尖 */}
        <circle data-pen r={4.5} fill={INK} stroke="#fff" strokeWidth={1.2} style={{ opacity: 0 }} />
      </svg>
      <div style={{ marginTop: 6, fontSize: 16, color: '#888' }}>{label}</div>
    </div>
  );
}

export function LetterStrokeAnimation({ upper, lower }: Props) {
  const [playId, setPlayId] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const myToken = ++tokenRef.current;

    const glyphs = Array.from(container.querySelectorAll<SVGSVGElement>('svg[data-glyph]'));
    const inkOf = (g: SVGSVGElement) => Array.from(g.querySelectorAll<SVGPathElement>('path[data-ink]'));
    const penOf = (g: SVGSVGElement) => g.querySelector<SVGCircleElement>('circle[data-pen]');

    // 能力检测：jsdom / 老 WebView 没有 getTotalLength 时，直接静态显示。
    const firstInk = glyphs[0]?.querySelector<SVGPathElement>('path[data-ink]');
    const canMeasure = glyphs.length > 0 && typeof firstInk?.getTotalLength === 'function';

    const showAllInstantly = () => {
      glyphs.forEach(g => {
        inkOf(g).forEach(p => {
          p.style.strokeDasharray = 'none';
          p.style.strokeDashoffset = '0';
        });
        const pen = penOf(g);
        if (pen) pen.style.opacity = '0';
      });
    };

    if (!canMeasure || prefersReducedMotion()) {
      showAllInstantly();
      return;
    }

    // 复位：全部隐藏
    glyphs.forEach(g => {
      inkOf(g).forEach(p => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
      const pen = penOf(g);
      if (pen) pen.style.opacity = '0';
    });

    const cancelled = () => tokenRef.current !== myToken;

    const animateStroke = (path: SVGPathElement, pen: SVGCircleElement | null): Promise<void> => {
      const len = path.getTotalLength();
      const dur = clamp((len / SPEED) * 1000, MIN_DUR, MAX_DUR);
      return new Promise<void>(resolve => {
        const start = performance.now();
        if (pen) pen.style.opacity = '1';
        const tick = (now: number) => {
          if (cancelled()) return resolve();
          const t = clamp((now - start) / dur, 0, 1);
          path.style.strokeDashoffset = `${len * (1 - t)}`;
          if (pen) {
            const pt = path.getPointAtLength(len * t);
            pen.setAttribute('cx', String(pt.x));
            pen.setAttribute('cy', String(pt.y));
          }
          if (t < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    };

    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    void (async () => {
      for (const g of glyphs) {
        const pen = penOf(g);
        const inks = inkOf(g);
        for (let i = 0; i < inks.length; i++) {
          if (cancelled()) return;
          await animateStroke(inks[i], pen);
          if (cancelled()) return;
          if (i < inks.length - 1) await sleep(GAP_MS);
        }
        if (pen) pen.style.opacity = '0';
        if (cancelled()) return;
        await sleep(GAP_MS);
      }
    })();

    return () => { tokenRef.current++; };
  }, [upper, lower, playId]);

  return (
    <div style={{ textAlign: 'center' }} ref={containerRef}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        <Panel char={upper} label="大写" />
        <Panel char={lower} label="小写" />
      </div>
      <button
        onClick={() => setPlayId(id => id + 1)}
        style={{
          marginTop: 16, fontSize: 18, padding: '10px 20px', borderRadius: 16,
          border: '2px solid #fb8500', background: '#fff', color: '#fb8500',
          fontWeight: 'bold', cursor: 'pointer',
        }}
      >
        ✏️ 再写一遍
      </button>
    </div>
  );
}
