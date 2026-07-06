import type { CSSProperties } from 'react';
import { MAX_FAMILIARITY } from '../utils/familiarity';

interface DisplayProps {
  /** 当前熟悉度档位（0-5）。 */
  level: number;
  /** 单个 ♥️ 的字号。 */
  size?: number;
  /** 总档位数，默认 5。 */
  max?: number;
}

/** 只读展示：用 ♥️ 表示熟悉程度（红心=已达到，白心=未达到）。
 *  用于字母 / 拼音 / 汉字列表卡片上。 */
export function FamiliarityHearts({ level, size = 12, max = MAX_FAMILIARITY }: DisplayProps) {
  const filled = Math.max(0, Math.min(max, Math.round(level)));
  return (
    <span
      aria-label={`熟悉度 ${filled} / ${max}`}
      style={{ fontSize: size, letterSpacing: -1, lineHeight: 1, whiteSpace: 'nowrap' }}
    >
      {'❤️'.repeat(filled)}
      {'🤍'.repeat(max - filled)}
    </span>
  );
}

interface EditorProps {
  /** 当前熟悉度档位（0-5）。 */
  level: number;
  /** 点击某档时回调，传入新的档位。 */
  onChange: (level: number) => void;
  /** 单个 ♥️ 的字号。 */
  size?: number;
  /** 总档位数，默认 5。 */
  max?: number;
}

/** 可编辑：点 ♥️ 设置熟悉度；再次点当前最高档可减一档。
 *  用于详情页让小朋友自己调整熟悉度。 */
export function FamiliarityEditor({ level, onChange, size = 40, max = MAX_FAMILIARITY }: EditorProps) {
  return (
    <div role="group" aria-label="设置熟悉程度" style={{ display: 'inline-flex', gap: 6 }}>
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        const active = value <= level;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(level === value ? value - 1 : value)}
            aria-label={`熟悉度 ${value} 档`}
            aria-pressed={active}
            style={{ ...heartBtn, fontSize: size, filter: active ? 'none' : 'grayscale(0.3)', opacity: active ? 1 : 0.55 }}
          >
            {active ? '❤️' : '🤍'}
          </button>
        );
      })}
    </div>
  );
}

const heartBtn: CSSProperties = {
  lineHeight: 1,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 2,
};
