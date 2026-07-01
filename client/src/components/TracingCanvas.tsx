import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

interface Props {
  upper: string;
  lower: string;
}

const COLORS = ['#fb8500', '#2a9d8f', '#e76f51', '#4361ee'];

/** 仿照描写区域：浅色引导字 + 四线格，小朋友用手指/鼠标照着描写。 */
export function TracingCanvas({ upper, lower }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const colorRef = useRef(COLORS[0]);

  const [useUpper, setUseUpper] = useState(true);
  const [color, setColor] = useState(COLORS[0]);
  const guideChar = useUpper ? upper : lower;

  colorRef.current = color;

  // 依据显示尺寸 × devicePixelRatio 设置画布分辨率，保证清晰。
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 14;
      }
    };
    setup();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(setup);
      ro.observe(canvas);
      return () => ro.disconnect();
    }
  }, []);

  const posFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = posFromEvent(e);
    // 画一个点，方便点按也能留痕。
    const ctx = canvas.getContext('2d');
    if (ctx && last.current) {
      ctx.fillStyle = colorRef.current;
      ctx.beginPath();
      ctx.arc(last.current.x, last.current.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !last.current) return;
    const p = posFromEvent(e);
    ctx.strokeStyle = colorRef.current;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // 切换大小写时清空重来。
  useEffect(() => { clear(); }, [useUpper]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => setUseUpper(true)} style={toggleStyle(useUpper)}>大写 {upper}</button>
        <button onClick={() => setUseUpper(false)} style={toggleStyle(!useUpper)}>小写 {lower}</button>
      </div>

      <div style={{
        position: 'relative', width: 'min(320px, 82vw)', aspectRatio: '1 / 1',
        margin: '0 auto', touchAction: 'none',
      }}>
        {/* 引导层：四线格 + 浅色字（不拦截指针） */}
        <svg
          viewBox="0 0 300 300"
          width="100%"
          height="100%"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: '#fffdf7', borderRadius: 20, border: '3px solid #8ecae6',
          }}
        >
          <line x1="0" y1="70" x2="300" y2="70" stroke="#e6eef5" strokeWidth="2" />
          <line x1="0" y1="150" x2="300" y2="150" stroke="#cfe1ee" strokeWidth="2" strokeDasharray="8 8" />
          <line x1="0" y1="230" x2="300" y2="230" stroke="#e6eef5" strokeWidth="2" />
          <text
            x="150" y="222" textAnchor="middle" fontSize="210" fontWeight="bold"
            fill="#eef3f8" fontFamily="'Comic Sans MS', 'Segoe UI', system-ui, sans-serif"
          >
            {guideChar}
          </text>
        </svg>
        {/* 绘制层 */}
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', borderRadius: 20 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, color: '#888' }}>选颜色：</span>
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-label={`选择颜色 ${c}`}
            style={{
              width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
              border: color === c ? '3px solid #333' : '3px solid #fff', boxShadow: '0 0 0 1px #ccc',
            }}
          />
        ))}
        <button
          onClick={clear}
          style={{
            marginLeft: 8, fontSize: 16, padding: '8px 18px', borderRadius: 14,
            border: '2px solid #ef476f', background: '#fff', color: '#ef476f', fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          🧽 擦掉重写
        </button>
      </div>
      <p style={{ fontSize: 14, color: '#aaa', marginTop: 8 }}>用手指或鼠标，照着浅色字描一描吧！</p>
    </div>
  );
}

function toggleStyle(active: boolean) {
  return {
    fontSize: 18, padding: '8px 18px', borderRadius: 14, cursor: 'pointer',
    border: active ? '3px solid #fb8500' : '2px solid #ccc',
    background: active ? '#fff8e7' : '#fff', fontWeight: 'bold' as const,
  };
}
