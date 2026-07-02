import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import HanziWriter from 'hanzi-writer';
import { HANZI } from '../data/hanzi';
import { loadStrokeData } from '../data/hanziStrokes';
import { readVisitedHanzi } from '../utils/hanziProgress';
import { shuffle } from './gameUtils';
import { useAudio } from '../hooks/useAudio';
import type { HanziItem } from '../types';

const TOTAL = 5;
const SIZE = 200;
const OUTLINE = '#e9d6a3';
const INK = '#fb8500';
const DRAW = '#06d6a0';
const GRID = '#efe3ba';

/** 候选字：已学过的字优先（打乱），不足用一年级上册补齐。纯函数，便于测试。 */
export function orderedWriteCandidates(visited: Set<string>): HanziItem[] {
  const learned = shuffle(HANZI.filter((h) => visited.has(h.char)));
  const fill = shuffle(HANZI.filter((h) => h.volumeId === 'g1a' && !visited.has(h.char)));
  const seen = new Set<string>();
  const out: HanziItem[] = [];
  for (const h of [...learned, ...fill]) {
    if (seen.has(h.char)) continue;
    seen.add(h.char);
    out.push(h);
  }
  return out;
}

/** 每字满分 20，每错 1 笔扣 2 分（最低 0），5 个字合计满分 100。 */
export function scoreFor(perCharMistakes: number[]): number {
  return perCharMistakes.reduce((s, m) => s + Math.max(0, 20 - 2 * m), 0);
}

/** 全关总错误笔画：0 → 3 星，1–4 → 2 星，其余 1 星（写完至少 1 星，鼓励为主）。 */
export function starsFor(totalMistakes: number): 0 | 1 | 2 | 3 {
  if (totalMistakes === 0) return 3;
  if (totalMistakes <= 4) return 2;
  return 1;
}

interface Props {
  userId: number;
  onFinish: (score: number, stars: 0 | 1 | 2 | 3) => void;
}

/** 跟我写 · 描红闯关：连续描写 5 个已学汉字，按笔顺用手指在田字格里写。 */
export function GameHanziWrite({ userId, onFinish }: Props) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<ReturnType<typeof HanziWriter.create> | null>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [chars, setChars] = useState<HanziItem[]>([]);
  const [index, setIndex] = useState(0);
  const [strokeDone, setStrokeDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [charDone, setCharDone] = useState(false);
  const [replayId, setReplayId] = useState(0);
  const { play } = useAudio();

  const perCharRef = useRef<number[]>([]);
  const curStrokeRef = useRef(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visited = useMemo(() => readVisitedHanzi(userId), [userId]);

  // 选字：等笔顺数据就绪后，挑出有笔顺的前 5 个字。
  useEffect(() => {
    let cancelled = false;
    loadStrokeData()
      .then((map) => {
        if (cancelled) return;
        const picked = orderedWriteCandidates(visited)
          .filter((h) => map[h.char])
          .slice(0, TOTAL);
        if (picked.length === 0) {
          setStatus('error');
          return;
        }
        perCharRef.current = [];
        setChars(picked);
        setIndex(0);
        setStatus('playing');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [visited]);

  const current = chars[index];

  // 进入新字时自动朗读一遍。
  useEffect(() => {
    if (status === 'playing' && current) void play(current.char);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, index, current?.char]);

  // 为当前字创建 hanzi-writer 描红 quiz。
  useEffect(() => {
    if (status !== 'playing' || !current) return;
    let cancelled = false;
    const el = targetRef.current;
    if (!el) return;
    el.innerHTML = '';
    setStrokeDone(0);
    setCharDone(false);
    curStrokeRef.current = 0;

    loadStrokeData()
      .then((map) => {
        if (cancelled) return;
        const data = map[current.char];
        if (!data) {
          setStatus('error');
          return;
        }
        setTotal(data.strokes.length);
        const writer = HanziWriter.create(el, current.char, {
          width: SIZE,
          height: SIZE,
          padding: 8,
          showOutline: true,
          showCharacter: false,
          strokeColor: INK,
          outlineColor: OUTLINE,
          drawingColor: DRAW,
          drawingWidth: 24,
          highlightColor: '#ffd166',
          charDataLoader: (_c, onLoad) => onLoad(data),
        });
        writerRef.current = writer;

        void writer.quiz({
          leniency: 1.3,
          showHintAfterMisses: false,
          markStrokeCorrectAfterMisses: 3,
          highlightOnComplete: true,
          onCorrectStroke: (s) => {
            if (cancelled) return;
            curStrokeRef.current = s.strokeNum + 1;
            setStrokeDone(s.strokeNum + 1);
          },
          onComplete: (summary) => {
            if (cancelled) return;
            handleComplete(summary.totalMistakes);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, index, replayId]);

  // 卸载时清掉待跳转定时器。
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  function handleComplete(mistakes: number) {
    perCharRef.current = [...perCharRef.current, mistakes];
    setCharDone(true);
    advanceTimer.current = setTimeout(() => {
      if (index + 1 >= chars.length) {
        const per = perCharRef.current;
        const totalMistakes = per.reduce((s, m) => s + m, 0);
        onFinish(scoreFor(per), starsFor(totalMistakes));
      } else {
        setIndex((i) => i + 1);
      }
    }, 1200);
  }

  // 高亮当前应写的这一笔。
  function showHint() {
    const w = writerRef.current;
    if (!w || charDone || curStrokeRef.current >= total) return;
    try {
      void w.highlightStroke(curStrokeRef.current);
    } catch {
      /* ignore */
    }
  }

  // 看一遍完整笔顺，然后重新开始这个字。
  async function peek() {
    const w = writerRef.current;
    if (!w || charDone) return;
    try {
      w.cancelQuiz();
      await w.animateCharacter();
      w.hideCharacter();
    } catch {
      /* ignore */
    }
    setReplayId((id) => id + 1);
  }

  // 重写当前字（新 quiz，错误笔画重新计）。
  function redo() {
    if (charDone) return;
    setReplayId((id) => id + 1);
  }

  if (status === 'loading') {
    return (
      <div style={wrap}>
        <p style={{ fontSize: 18, color: '#888' }}>准备汉字中…✍️</p>
      </div>
    );
  }

  if (status === 'error' || !current) {
    return (
      <div style={wrap}>
        <p style={{ fontSize: 22 }}>😅 暂时没有可练习的字</p>
        <p style={{ color: '#888', fontSize: 16 }}>先去「拼音学汉字」认几个字再来吧～</p>
      </div>
    );
  }

  const word = current.words[0];
  const lastChar = index + 1 >= chars.length;

  return (
    <div style={wrap}>
      <div style={{ fontSize: 18, color: '#666' }}>
        第 {index + 1} / {chars.length} 字　已写 {strokeDone} / {total} 笔
      </div>
      <h2 style={{ fontSize: 'clamp(22px, 3vh, 26px)', margin: '10px 0 4px' }}>跟着笔顺描一描 ✍️</h2>

      {/* 提示：读音 + 组词 */}
      <div style={promptCard}>
        <span style={{ fontSize: 22, color: INK, fontWeight: 'bold' }}>{current.pinyin}</span>
        {word && <span style={{ fontSize: 20, color: '#555' }}>· {word.word}</span>}
        <button onClick={() => void play(current.char)} style={roundBtn} aria-label={`朗读 ${current.char}`}>
          🔊
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
        <button onClick={() => void peek()} disabled={charDone} style={pillBtn('#8ecae6', !charDone)} aria-label="看一遍笔顺">
          👀 看一遍
        </button>
        <button onClick={showHint} disabled={charDone} style={pillBtn('#ffb703', !charDone)} aria-label="提示这一笔">
          💡 提示这一笔
        </button>
      </div>

      <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '12px auto 0', touchAction: 'none' }}>
        <svg width={SIZE} height={SIZE} viewBox="0 0 100 100" style={gridStyle} aria-hidden="true">
          <rect x="1" y="1" width="98" height="98" rx="6" fill="#fffdf7" stroke="#ffd166" strokeWidth="1.5" />
          <line x1="50" y1="2" x2="50" y2="98" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
          <line x1="2" y1="50" x2="98" y2="50" stroke={GRID} strokeWidth="0.8" strokeDasharray="4 4" />
        </svg>
        <div
          ref={targetRef}
          style={{ position: 'relative', width: SIZE, height: SIZE }}
          role="img"
          aria-label={`描红 ${current.char}`}
        />
      </div>

      {charDone ? (
        <div style={{ marginTop: 14, fontSize: 22, fontWeight: 'bold', color: '#06a37a' }}>
          🎉 {lastChar ? '全部写完啦！' : '写对啦，下一个 →'}
        </div>
      ) : (
        <button onClick={redo} style={ghostBtn} aria-label="重写这个字">
          🧽 重写
        </button>
      )}
    </div>
  );
}

const wrap: CSSProperties = {
  maxWidth: 720,
  margin: '20px auto',
  padding: 24,
  textAlign: 'center',
};

const gridStyle: CSSProperties = { position: 'absolute', inset: 0 };

const promptCard: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 18px',
  marginTop: 6,
  borderRadius: 999,
  background: '#fff8e7',
  border: '2px solid #ffd166',
};

const roundBtn: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 20,
  border: 'none',
  background: '#ffd166',
  fontSize: 18,
  cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  padding: '8px 18px',
  borderRadius: 14,
  border: '2px solid #bbb',
  background: '#fff',
  color: '#666',
  cursor: 'pointer',
};

function pillBtn(color: string, enabled: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    fontSize: 16,
    borderRadius: 999,
    border: `2px solid ${enabled ? color : '#ddd'}`,
    background: enabled ? '#fff' : '#f3f3f3',
    color: enabled ? '#444' : '#aaa',
    fontWeight: 'bold',
    cursor: enabled ? 'pointer' : 'default',
  };
}
