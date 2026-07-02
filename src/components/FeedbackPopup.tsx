import type { CSSProperties } from 'react';

interface Props {
  /** 'right' = 答对，'wrong' = 答错。 */
  kind: 'right' | 'wrong';
  /** 主标题，如 "🎉 答对了！"。 */
  title: string;
  /** 可选副标题，如 "正确：a"。 */
  subtitle?: string;
}

/**
 * 居中弹窗式答题反馈。固定定位 + 半透明遮罩，始终显示在屏幕正中，
 * 不会被页面底部遮挡。纯展示组件，显隐由父组件控制。
 */
export function FeedbackPopup({ kind, title, subtitle }: Props) {
  const accent = kind === 'right' ? '#06d6a0' : '#fb8500';
  return (
    <div style={overlayStyle} role="alertdialog" aria-live="assertive" aria-label={title}>
      <div style={{ ...cardStyle, border: `5px solid ${accent}` }}>
        <div style={{ fontSize: 'clamp(28px, 6vh, 48px)', fontWeight: 'bold', color: accent }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 'clamp(18px, 3vh, 26px)', color: '#555', marginTop: 12 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0, 0, 0, 0.35)',
  zIndex: 1000,
  animation: 'popup-fade 120ms ease-out',
  padding: 24,
};

const cardStyle: CSSProperties = {
  background: '#fff',
  borderRadius: 28,
  padding: 'clamp(24px, 5vh, 48px) clamp(32px, 8vw, 72px)',
  textAlign: 'center',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  animation: 'popup-pop 260ms cubic-bezier(.34, 1.56, .64, 1)',
  maxWidth: '90vw',
};
