import { useEffect, useRef, useState, type CSSProperties } from 'react';
import HanziWriter from 'hanzi-writer';
import { loadStrokeData } from '../data/hanziStrokes';

interface Props {
  char: string;
}

const SIZE = 190;
const INK = '#fb8500';
const OUTLINE = '#f0d9a6';
const GRID = '#efe3ba';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/** 汉字笔顺演示：逐笔书写动画（hanzi-writer + 离线笔顺数据）。 */
export function HanziStrokeAnimation({ char }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<ReturnType<typeof HanziWriter.create> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [playId, setPlayId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const el = targetRef.current;
    if (!el) return;
    el.innerHTML = '';
    setStatus('loading');

    loadStrokeData()
      .then((map) => {
        if (cancelled) return;
        const data = map[char];
        if (!data) {
          setStatus('error');
          return;
        }
        const writer = HanziWriter.create(el, char, {
          width: SIZE,
          height: SIZE,
          padding: 8,
          showOutline: true,
          strokeColor: INK,
          outlineColor: OUTLINE,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 360,
          charDataLoader: (_c, onLoad) => onLoad(data),
        });
        writerRef.current = writer;
        setStatus('ready');
        if (prefersReducedMotion()) {
          writer.showCharacter();
        } else {
          void writer.animateCharacter();
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      try {
        writerRef.current?.hideCharacter();
      } catch {
        /* ignore */
      }
      writerRef.current = null;
      if (el) el.innerHTML = '';
    };
  }, [char, playId]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto' }}>
        {/* 田字格背景 */}
        <svg width={SIZE} height={SIZE} viewBox="0 0 100 100" style={gridStyle} aria-hidden="true">
          <rect x="1" y="1" width="98" height="98" rx="6" fill="#fffdf7" stroke="#ffd166" strokeWidth="1.5" />
          <line x1="50" y1="2" x2="50" y2="98" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="2" y1="50" x2="98" y2="50" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
        </svg>
        {/* 笔顺书写层 */}
        <div ref={targetRef} style={{ position: 'relative', width: SIZE, height: SIZE }} />
        {status === 'error' && (
          <div style={fallbackStyle} aria-hidden="true">
            <span style={{ fontSize: 96, fontWeight: 'bold', color: INK }}>{char}</span>
          </div>
        )}
      </div>
      {status === 'error' ? (
        <div style={{ marginTop: 8, fontSize: 14, color: '#aaa' }}>该字暂无笔顺演示</div>
      ) : (
        <button onClick={() => setPlayId((id) => id + 1)} style={replayBtn} aria-label={`再写一遍 ${char}`}>
          ✏️ 再写一遍
        </button>
      )}
    </div>
  );
}

const gridStyle: CSSProperties = { position: 'absolute', inset: 0 };

const fallbackStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const replayBtn: CSSProperties = {
  marginTop: 14,
  fontSize: 18,
  padding: '10px 20px',
  borderRadius: 16,
  border: '2px solid #fb8500',
  background: '#fff',
  color: '#fb8500',
  fontWeight: 'bold',
  cursor: 'pointer',
};
