import type { PinyinItem } from '../types';

interface Props {
  items: PinyinItem[];
  learnedIds?: Set<string>;
  onClick: (item: PinyinItem) => void;
}

export function PinyinGrid({ items, learnedIds, onClick }: Props) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12,
    }}>
      {items.map(item => {
        const learned = learnedIds?.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onClick(item)}
            style={{
              padding: 16, fontSize: 36, fontWeight: 'bold',
              borderRadius: 16, border: '3px solid #8ecae6',
              background: learned ? '#fff8e7' : '#fff',
              cursor: 'pointer', position: 'relative',
            }}
          >
            {item.display}
            {learned && <span style={{ position: 'absolute', top: 4, right: 6, fontSize: 14 }}>⭐</span>}
          </button>
        );
      })}
    </div>
  );
}
