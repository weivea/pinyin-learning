import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { getStrokes } from '../data/letterStrokes';
import { StarRating } from './StarRating';
import { gradeStroke, starsForMistakes, type Pt } from './letterTracing';

interface Props {
  upper: string;
  lower: string;
}

const GUIDE = '#e7edf3';
const CURRENT = '#8ecae6';
const INK = '#219ebc';
const DRAW = '#06d6a0';
const GRIDLINE = '#e6eef5';

const SAMPLE_N = 24;
const HINT_AFTER_MISSES = 2;
const PASS_AFTER_MISSES = 4;

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/** 字母描红闯关：按笔顺逐笔引导，用手指/鼠标沿中心线描写，判定 + 星星。
 *  复用 letterStrokes 的中心线数据，不依赖 hanzi-writer。 */
export function LetterTracingQuiz({ upper, lower }: Props) {
  const [useUpper, setUseUpper] = useState(true);
  const glyph = useUpper ? upper : lower;
  const strokes = useMemo(() => getStrokes(glyph), [glyph]);

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const hintRef = useRef<SVGPathElement | null>(null);
  const hintAnimRef = useRef(0);

  const [current, setCurrent] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [strokeMisses, setStrokeMisses] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'good' | 'retry'>('idle');
  const [userPath, setUserPath] = useState<Pt[]>([]);
  const drawing = useRef(false);
  const collected = useRef<Pt[]>([]);

  const completed = current >= strokes.length && strokes.length > 0;

  // 切换字母/大小写时复位。
  const reset = () => {
    setCurrent(0);
    setMistakes(0);
    setStrokeMisses(0);
    setShowHint(false);
    setFeedback('idle');
    setUserPath([]);
    collected.current = [];
  };
  useEffect(reset, [glyph]);

  // 采样目标笔画中心线为点集（viewBox 坐标）。
  const sampleStroke = (idx: number): Pt[] => {
    const path = pathRefs.current[idx];
    if (!path || typeof path.getTotalLength !== 'function') return [];
    const len = path.getTotalLength();
    if (!len) return [];
    const pts: Pt[] = [];
    for (let i = 0; i <= SAMPLE_N; i++) {
      const p = path.getPointAtLength((len * i) / SAMPLE_N);
      pts.push({ x: p.x, y: p.y });
    }
    return pts;
  };

  // 屏幕坐标 → viewBox(0..100)。SVG 为正方形，等比映射即可。
  const toViewBox = (e: ReactPointerEvent): Pt | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const onDown = (e: ReactPointerEvent) => {
    if (completed) return;
    const p = toViewBox(e);
    if (!p) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    collected.current = [p];
    setUserPath([p]);
    setFeedback('idle');
  };

  const onMove = (e: ReactPointerEvent) => {
    if (!drawing.current) return;
    const p = toViewBox(e);
    if (!p) return;
    collected.current.push(p);
    setUserPath((prev) => [...prev, p]);
  };

  // 结束一笔。grade=true：正常抬手，判分；
  // grade=false：指针被系统取消（iOS 误判滚动 / 丢失捕获），静默丢弃这一笔，
  // 不计错、不弹「再描一次」，让孩子直接重画，避免刚起笔就被判失败。
  const endStroke = (grade: boolean) => {
    if (!drawing.current) return;
    drawing.current = false;
    const user = collected.current;
    collected.current = [];
    setUserPath([]);
    if (!grade || completed) return;

    const target = sampleStroke(current);
    // 能力缺失（老 WebView / jsdom 无 getTotalLength）：直接放行当前笔。
    if (target.length === 0) {
      advance();
      return;
    }

    const res = gradeStroke(user, target);
    if (res.ok) {
      setFeedback('good');
      advance();
    } else {
      const misses = strokeMisses + 1;
      setStrokeMisses(misses);
      setMistakes((m) => m + 1);
      setFeedback('retry');
      if (misses >= PASS_AFTER_MISSES) {
        // 连错太多次：自动过关，避免低龄挫败。
        advance();
      } else if (misses >= HINT_AFTER_MISSES) {
        setShowHint(true);
      }
    }
  };

  const onUp = () => endStroke(true);
  const onCancel = () => endStroke(false);

  // iOS WKWebView：本组件位于可滚动的 .page-main 内，手指一划动，WebView 可能
  // 把手势识别成滚动并对 SVG 触发 pointercancel，导致刚起笔的绿色墨迹被打断。
  // 在描写过程中对原生 touchmove 调用 preventDefault，阻止父级滚动抢占手势。
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const preventScroll = (e: TouchEvent) => {
      if (drawing.current) e.preventDefault();
    };
    svg.addEventListener('touchmove', preventScroll, { passive: false });
    return () => svg.removeEventListener('touchmove', preventScroll);
  }, []);

  const advance = () => {
    setStrokeMisses(0);
    setShowHint(false);
    setCurrent((c) => c + 1);
  };

  // 提示动画：沿当前笔画中心线快速走一遍。
  useEffect(() => {
    const path = hintRef.current;
    if (!showHint || !path || typeof path.getTotalLength !== 'function') return;
    if (prefersReducedMotion()) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const myId = ++hintAnimRef.current;
    const start = performance.now();
    const dur = 900;
    const tick = (now: number) => {
      if (hintAnimRef.current !== myId) return;
      const t = Math.min(1, (now - start) / dur);
      path.style.strokeDashoffset = `${len * (1 - t)}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      hintAnimRef.current++;
    };
  }, [showHint, current, glyph]);

  const stars = starsForMistakes(mistakes);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <button onClick={() => setUseUpper(true)} style={toggleStyle(useUpper)}>大写 {upper}</button>
        <button onClick={() => setUseUpper(false)} style={toggleStyle(!useUpper)}>小写 {lower}</button>
      </div>

      <p style={{ fontSize: 15, color: '#888', margin: '0 0 10px' }}>
        {completed ? '闯关成功！' : `按顺序描第 ${current + 1} 笔 / 共 ${strokes.length} 笔`}
      </p>

      <div style={{ position: 'relative', width: 'min(300px, 80vw)', aspectRatio: '1 / 1', margin: '0 auto', touchAction: 'none' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          role="img"
          aria-label={`字母 ${glyph} 描红闯关`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onCancel}
          onLostPointerCapture={onCancel}
          style={{ background: '#fffdf7', borderRadius: 20, border: '3px solid #8ecae6', cursor: 'crosshair', touchAction: 'none' }}
        >
          {/* 所有可视内容都不参与命中测试，SVG 根节点是唯一的指针目标；
              这样描写途中子节点重绘（当前笔高亮 / 实时墨迹）不会触发
              pointerout/leave，从而不会打断正在进行的一笔。 */}
          <g style={{ pointerEvents: 'none' }}>
          {/* 四线格 */}
          <line x1="8" y1="16" x2="92" y2="16" stroke={GRIDLINE} strokeWidth="1" strokeDasharray="3 5" />
          <line x1="8" y1="46" x2="92" y2="46" stroke="#cfe1ee" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="8" y1="80" x2="92" y2="80" stroke={GRIDLINE} strokeWidth="1.2" />

          {/* 全部笔画的浅色引导 + 已完成/当前高亮；这些 path 也用于采样 */}
          {strokes.map((d, i) => {
            const isDone = i < current;
            const isCurrent = i === current && !completed;
            return (
              <path
                key={`s-${i}`}
                ref={(el) => { pathRefs.current[i] = el; }}
                d={d}
                fill="none"
                stroke={isDone ? INK : isCurrent ? CURRENT : GUIDE}
                strokeWidth={isDone ? 7 : isCurrent ? 8 : 6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={isCurrent && !showHint ? '2 6' : undefined}
                opacity={isCurrent ? 0.9 : 1}
              />
            );
          })}

          {/* 提示层：连错后沿当前笔画走一遍 */}
          {!completed && showHint && strokes[current] && (
            <path
              ref={hintRef}
              d={strokes[current]}
              fill="none"
              stroke={INK}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 用户实时轨迹 */}
          {userPath.length > 1 && (
            <polyline
              points={userPath.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={DRAW}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          </g>
        </svg>

        {/* 完成庆祝覆盖层 */}
        {completed && (
          <div style={celebrateStyle} aria-hidden="true">
            <div style={{ fontSize: 40 }}>🎉</div>
          </div>
        )}
      </div>

      <div style={{ minHeight: 26, marginTop: 8, fontSize: 16 }}>
        {feedback === 'good' && !completed && <span style={{ color: '#06a37a' }}>✅ 这一笔真棒！</span>}
        {feedback === 'retry' && <span style={{ color: '#ef476f' }}>再沿着蓝线描一次试试～</span>}
      </div>

      {completed ? (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#06a37a' }}>🏆 闯关成功！</div>
          <div style={{ margin: '6px 0' }}><StarRating stars={stars} /></div>
          <div style={{ fontSize: 14, color: '#999' }}>
            {mistakes === 0 ? '一次全对，了不起！' : `描错 ${mistakes} 次，再来一遍会更棒`}
          </div>
          <button onClick={reset} style={primaryBtn} aria-label={`再闯一次 ${glyph}`}>🏁 再闯一次</button>
        </div>
      ) : (
        <button onClick={reset} style={ghostBtn} aria-label={`重新开始 ${glyph}`}>🔄 重新开始</button>
      )}
    </div>
  );
}

function toggleStyle(active: boolean): CSSProperties {
  return {
    fontSize: 18, padding: '8px 18px', borderRadius: 14, cursor: 'pointer',
    border: active ? '3px solid #219ebc' : '2px solid #ccc',
    background: active ? '#eaf6fb' : '#fff', fontWeight: 'bold',
  };
}

const celebrateStyle: CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
};

const primaryBtn: CSSProperties = {
  marginTop: 12, fontSize: 18, padding: '10px 20px', borderRadius: 16,
  border: '2px solid #06d6a0', background: '#fff', color: '#06a37a', fontWeight: 'bold', cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  marginTop: 10, fontSize: 15, padding: '8px 18px', borderRadius: 14,
  border: '2px solid #bbb', background: '#fff', color: '#666', cursor: 'pointer',
};
