import { useEffect, useRef, useState, type CSSProperties } from 'react';
import HanziWriter from 'hanzi-writer';
import { loadStrokeData } from '../data/hanziStrokes';
import { StarRating } from './StarRating';

interface Props {
  char: string;
}

const SIZE = 190;
const OUTLINE = '#e9d6a3';
const INK = '#fb8500';
const DRAW = '#06d6a0';
const GRID = '#efe3ba';

/** 汉字描红练习：按笔顺用手指/鼠标在田字格里描写（hanzi-writer quiz）。 */
export function HanziTracing({ char }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<ReturnType<typeof HanziWriter.create> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [playId, setPlayId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const el = targetRef.current;
    if (!el) return;
    el.innerHTML = '';
    setStatus('loading');
    setDone(0);
    setMistakes(0);
    setCompleted(false);

    loadStrokeData()
      .then((map) => {
        if (cancelled) return;
        const data = map[char];
        if (!data) {
          setStatus('error');
          return;
        }
        setTotal(data.strokes.length);
        const writer = HanziWriter.create(el, char, {
          width: SIZE,
          height: SIZE,
          padding: 8,
          showOutline: true,
          showCharacter: false,
          strokeColor: INK,
          outlineColor: OUTLINE,
          drawingColor: DRAW,
          drawingWidth: 22,
          highlightColor: '#ffd166',
          charDataLoader: (_c, onLoad) => onLoad(data),
        });
        writerRef.current = writer;
        setStatus('ready');
        void writer.quiz({
          leniency: 1.2,
          showHintAfterMisses: 2,
          markStrokeCorrectAfterMisses: 3,
          highlightOnComplete: true,
          onCorrectStroke: (s) => {
            if (!cancelled) setDone(s.strokeNum + 1);
          },
          onMistake: (s) => {
            if (!cancelled) setMistakes(s.totalMistakes);
          },
          onComplete: (summary) => {
            if (cancelled) return;
            setMistakes(summary.totalMistakes);
            setDone(data.strokes.length);
            setCompleted(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      try {
        writerRef.current?.cancelQuiz();
      } catch {
        /* ignore */
      }
      writerRef.current = null;
      if (el) el.innerHTML = '';
    };
  }, [char, playId]);

  const stars = (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1) as 0 | 1 | 2 | 3;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 15, color: '#888', margin: '0 0 12px' }}>用手指按笔顺，在格子里描一描 ✍️</p>

      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto', touchAction: 'none' }}>
        <svg width={SIZE} height={SIZE} viewBox="0 0 100 100" style={gridStyle} aria-hidden="true">
          <rect x="1" y="1" width="98" height="98" rx="6" fill="#fffdf7" stroke="#ffd166" strokeWidth="1.5" />
          <line x1="50" y1="2" x2="50" y2="98" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="2" y1="50" x2="98" y2="50" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
        </svg>
        <div
          ref={targetRef}
          style={{ position: 'relative', width: SIZE, height: SIZE }}
          role="img"
          aria-label={`描红练习 ${char}`}
        />
        {status === 'error' && (
          <div style={fallbackStyle} aria-hidden="true">
            <span style={{ fontSize: 96, fontWeight: 'bold', color: OUTLINE }}>{char}</span>
          </div>
        )}
      </div>

      {status === 'error' ? (
        <div style={{ marginTop: 8, fontSize: 14, color: '#aaa' }}>该字暂无描红练习</div>
      ) : completed ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#06a37a' }}>🎉 写对啦！</div>
          <div style={{ margin: '6px 0' }}>
            <StarRating stars={stars} />
          </div>
          <div style={{ fontSize: 14, color: '#999' }}>{mistakes === 0 ? '一次就全对，太棒了！' : `写错 ${mistakes} 次，再练会更熟哦`}</div>
          <button onClick={() => setPlayId((id) => id + 1)} style={primaryBtn} aria-label={`再描一遍 ${char}`}>
            ✍️ 再描一遍
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 16, color: '#666' }}>已写 {done} / {total} 笔</div>
          <button onClick={() => setPlayId((id) => id + 1)} style={ghostBtn} aria-label={`重新描红 ${char}`}>
            🧽 重来
          </button>
        </div>
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

const primaryBtn: CSSProperties = {
  marginTop: 12,
  fontSize: 18,
  padding: '10px 20px',
  borderRadius: 16,
  border: '2px solid #06d6a0',
  background: '#fff',
  color: '#06a37a',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  marginTop: 10,
  fontSize: 15,
  padding: '8px 18px',
  borderRadius: 14,
  border: '2px solid #bbb',
  background: '#fff',
  color: '#666',
  cursor: 'pointer',
};
