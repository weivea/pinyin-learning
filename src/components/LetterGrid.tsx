import type { MouseEvent } from 'react';
import { LETTERS } from '../data/letters';
import { speakEnglish } from '../audio/speak';

interface Props {
  /** 已学过的小写字母集合（用于打勾标记）。 */
  learnedLetters?: Set<string>;
  /** 点击字母卡进入详情。 */
  onSelect: (lower: string) => void;
}

/** 26 个英文字母表，每个字母显示大小写 + 喇叭按钮朗读字母名。 */
export function LetterGrid({ learnedLetters, onSelect }: Props) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 14,
    }}>
      {LETTERS.map(item => {
        const learned = learnedLetters?.has(item.lower);
        const speak = (e: MouseEvent) => {
          e.stopPropagation();
          void speakEnglish(item.spokenName);
        };
        return (
          <div
            key={item.lower}
            onClick={() => onSelect(item.lower)}
            role="button"
            tabIndex={0}
            aria-label={`字母 ${item.letter}`}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.lower); } }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '16px 8px', borderRadius: 20, border: '3px solid #8ecae6',
              background: learned ? '#fff8e7' : '#fff', cursor: 'pointer', position: 'relative',
            }}
          >
            {learned && <span style={{ position: 'absolute', top: 6, right: 8, fontSize: 14 }}>⭐</span>}
            <div style={{ fontSize: 40, fontWeight: 'bold', color: '#fb8500', lineHeight: 1 }}>
              {item.letter}<span style={{ color: '#219ebc' }}>{item.lower}</span>
            </div>
            <button
              onClick={speak}
              aria-label={`朗读字母 ${item.letter}`}
              style={{
                width: 40, height: 40, borderRadius: 20, border: 'none',
                background: '#ffd166', fontSize: 20, cursor: 'pointer',
              }}
            >
              🔊
            </button>
          </div>
        );
      })}
    </div>
  );
}
