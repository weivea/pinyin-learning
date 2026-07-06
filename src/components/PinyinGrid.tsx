import type { PinyinItem } from '../types';
import { FamiliarityHearts } from './FamiliarityHearts';

interface Props {
  items: PinyinItem[];
  learnedIds?: Set<string>;
  /** 每个拼音的熟悉度（0-5，用 ♥️ 展示）。 */
  familiarity?: Record<string, number>;
  onClick: (item: PinyinItem) => void;
}

export function PinyinGrid({ items, learnedIds, familiarity, onClick }: Props) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12,
    }}>
      {items.map(item => {
        const learned = learnedIds?.has(item.id);
        const famLevel = familiarity?.[item.id] ?? 0;
        return (
          <button
            key={item.id}
            onClick={() => onClick(item)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: 16, fontSize: 36, fontWeight: 'bold',
              borderRadius: 16, border: '3px solid #8ecae6',
              background: learned ? '#fff8e7' : '#fff',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span>{item.display}</span>
            {famLevel > 0 && <FamiliarityHearts level={famLevel} size={12} />}
            {learned && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 14 }}>⭐</span>}
          </button>
        );
      })}
    </div>
  );
}
