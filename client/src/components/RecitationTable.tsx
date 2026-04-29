import { useEffect, useRef } from 'react';
import type { PinyinCategory, PinyinItem } from '../types';
import { RecitationCell } from './RecitationCell';

export interface RecitationGroup {
  category: PinyinCategory;
  label: string;
  items: PinyinItem[];
}

interface Props {
  groups: RecitationGroup[];
  highlightId: string | null;
  onCellClick: (item: PinyinItem) => void;
}

const ANCHORS: { category: PinyinCategory; label: string }[] = [
  { category: 'initial', label: '声母' },
  { category: 'simple-final', label: '单韵母' },
  { category: 'compound-final', label: '复韵母' },
  { category: 'whole-syllable', label: '整体认读' },
];

export function RecitationTable({ groups, highlightId, onCellClick }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!highlightId || !rootRef.current) return;
    const el = rootRef.current.querySelector<HTMLElement>(`[data-testid="cell-${highlightId}"]`);
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  }, [highlightId]);

  return (
    <div ref={rootRef}>
      <nav style={{ display: 'flex', gap: 12, padding: '8px 0', flexWrap: 'wrap' }}>
        {ANCHORS.map(a => (
          <a key={a.category} href={`#anchor-${a.category}`}
             style={{ padding: '6px 12px', fontSize: 18, color: '#0077b6', textDecoration: 'none' }}>
            {a.label}
          </a>
        ))}
      </nav>

      {groups.map(group => (
        <section key={group.category} id={`anchor-${group.category}`} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 24, margin: '12px 0' }}>
            {group.label} ({group.items.length})
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {group.items.map(item => (
              <RecitationCell
                key={item.id}
                item={item}
                isHighlight={item.id === highlightId}
                onClick={() => onCellClick(item)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
